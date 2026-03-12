import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET: Obtener disponibilidad de todas las pistas de un club para una fecha
// Publica (sin auth) - devuelve bloques ocupados anonimizados
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Parametro 'date' requerido (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    // Sesion opcional: si hay usuario logueado, calcular esPropia
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id ?? null;

    const club = await db.club.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        openingTime: true,
        closingTime: true,
        bookingDuration: true,
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: "Club no encontrado." },
        { status: 404 }
      );
    }

    const fechaInicio = new Date(`${date}T00:00:00`);
    const fechaFin = new Date(`${date}T23:59:59`);

    // Query paralela: reservas + partidas abiertas + bloqueos + pistas del dia
    const [reservas, partidasAbiertas, bloqueosDia, pistas] = await Promise.all([
      db.booking.findMany({
        where: {
          clubId: club.id,
          status: { not: "cancelled" },
          startTime: { gte: fechaInicio },
          endTime: { lte: new Date(fechaFin.getTime() + 1000) },
        },
        select: {
          courtId: true,
          startTime: true,
          endTime: true,
          userId: true,
          openMatch: {
            select: { id: true },
          },
        },
      }),
      db.openMatch.findMany({
        where: {
          clubId: club.id,
          status: { in: ["OPEN", "FULL"] },
          matchTime: { gte: fechaInicio, lte: fechaFin },
        },
        select: {
          id: true,
          courtId: true,
          matchTime: true,
          levelMin: true,
          levelMax: true,
          status: true,
          players: {
            select: { userId: true },
          },
        },
      }),
      db.courtBlock.findMany({
        where: {
          clubId: club.id,
          startTime: { lt: new Date(fechaFin.getTime() + 1000) },
          endTime: { gt: fechaInicio },
        },
        select: {
          id: true,
          courtId: true,
          reason: true,
          note: true,
          startTime: true,
          endTime: true,
        },
      }),
      db.court.findMany({
        where: { clubId: club.id },
        select: { id: true },
      }),
    ]);

    // Transformar reservas en bloques (excluir las que son de partidas abiertas, ya se manejan aparte)
    const bloques: Record<string, unknown>[] = reservas
      .filter((r) => !r.openMatch)
      .map((r) => ({
        courtId: r.courtId,
        tipo: "reserva" as const,
        inicio: r.startTime.toISOString(),
        fin: r.endTime.toISOString(),
        esPropia: sessionUserId ? r.userId === sessionUserId : false,
      }));

    // Agregar partidas abiertas como bloques
    const duracion = club.bookingDuration || 90;
    for (const partida of partidasAbiertas) {
      const fin = new Date(
        partida.matchTime.getTime() + duracion * 60 * 1000
      );
      bloques.push({
        courtId: partida.courtId,
        tipo: "partida-abierta",
        inicio: partida.matchTime.toISOString(),
        fin: fin.toISOString(),
        esPropia: sessionUserId
          ? partida.players.some((p) => p.userId === sessionUserId)
          : false,
        plazasLibres: 4 - partida.players.length,
        nivelMin: partida.levelMin,
        nivelMax: partida.levelMax,
        openMatchId: partida.id,
      });
    }

    // Agregar bloqueos como bloques
    const pistaIds = pistas.map((p) => p.id);
    for (const bloqueo of bloqueosDia) {
      if (bloqueo.courtId) {
        // Bloqueo de pista especifica
        bloques.push({
          courtId: bloqueo.courtId,
          tipo: "bloqueo",
          inicio: bloqueo.startTime.toISOString(),
          fin: bloqueo.endTime.toISOString(),
          reason: bloqueo.reason,
          note: bloqueo.note,
        });
      } else {
        // Bloqueo club-wide: un bloque por cada pista
        for (const pistaId of pistaIds) {
          bloques.push({
            courtId: pistaId,
            tipo: "bloqueo",
            inicio: bloqueo.startTime.toISOString(),
            fin: bloqueo.endTime.toISOString(),
            reason: bloqueo.reason,
            note: bloqueo.note,
          });
        }
      }
    }

    // Cache publica solo para peticiones anonimas; privada si hay sesion
    const cacheControl = sessionUserId
      ? 'private, no-store'
      : 'public, s-maxage=15, stale-while-revalidate=10';

    return NextResponse.json({
      date,
      bookingDuration: club.bookingDuration || 90,
      openingTime: club.openingTime || "09:00",
      closingTime: club.closingTime || "23:00",
      bloques,
    }, {
      headers: { 'Cache-Control': cacheControl },
    });
  } catch (error) {
    logger.error("CLUB_AVAILABILITY", "Error al obtener disponibilidad del club", { ruta: "/api/club/[slug]/availability" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
