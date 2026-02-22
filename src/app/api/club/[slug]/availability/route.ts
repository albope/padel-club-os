import { db } from "@/lib/db";
import { NextResponse } from "next/server";

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

    // Query paralela: reservas confirmadas + partidas abiertas del dia
    const [reservas, partidasAbiertas] = await Promise.all([
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
    ]);

    // Transformar reservas en bloques (excluir las que son de partidas abiertas, ya se manejan aparte)
    const reservaIds = new Set(
      partidasAbiertas.map((p) => p.id)
    );

    const bloques = reservas
      .filter((r) => !r.openMatch)
      .map((r) => ({
        courtId: r.courtId,
        tipo: "reserva" as const,
        inicio: r.startTime.toISOString(),
        fin: r.endTime.toISOString(),
        userId: r.userId,
      }));

    // Agregar partidas abiertas como bloques
    const duracion = club.bookingDuration || 90;
    for (const partida of partidasAbiertas) {
      const fin = new Date(
        partida.matchTime.getTime() + duracion * 60 * 1000
      );
      bloques.push({
        courtId: partida.courtId,
        tipo: "partida-abierta" as any,
        inicio: partida.matchTime.toISOString(),
        fin: fin.toISOString(),
        userId: null as any,
        plazasLibres: 4 - partida.players.length,
        nivelMin: partida.levelMin,
        nivelMax: partida.levelMax,
        openMatchId: partida.id,
        jugadores: partida.players.map((p) => p.userId),
      } as any);
    }

    return NextResponse.json({
      date,
      bookingDuration: club.bookingDuration || 90,
      openingTime: club.openingTime || "09:00",
      closingTime: club.closingTime || "23:00",
      bloques,
    });
  } catch (error) {
    console.error("[GET_CLUB_AVAILABILITY_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
