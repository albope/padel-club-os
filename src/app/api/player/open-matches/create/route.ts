import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { calcularPrecioReserva } from "@/lib/pricing";
import { notificarClub } from "@/lib/notifications";

// POST: El jugador crea una nueva partida abierta (queda inscrito automaticamente)
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("open-matches:create");
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { courtId, matchDate, matchTime, levelMin, levelMax } = body;

    if (!courtId || !matchDate || !matchTime) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (courtId, matchDate, matchTime)." },
        { status: 400 }
      );
    }

    const club = await db.club.findUnique({
      where: { id: auth.session.user.clubId },
      select: {
        enableOpenMatches: true,
        bookingDuration: true,
        maxAdvanceBooking: true,
      },
    });

    if (!club?.enableOpenMatches) {
      return NextResponse.json(
        { error: "Las partidas abiertas no estan habilitadas en este club." },
        { status: 403 }
      );
    }

    const duracionMinutos = club.bookingDuration || 90;
    const startTime = new Date(`${matchDate}T${matchTime}:00`);
    const endTime = new Date(startTime.getTime() + duracionMinutos * 60 * 1000);
    const now = new Date();

    // No en el pasado
    if (startTime < now) {
      return NextResponse.json(
        { error: "No puedes crear una partida en el pasado." },
        { status: 400 }
      );
    }

    // Ventana maxima de antelacion
    if (club.maxAdvanceBooking) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + club.maxAdvanceBooking);
      if (startTime > maxDate) {
        return NextResponse.json(
          { error: `Solo puedes crear partidas con ${club.maxAdvanceBooking} dias de antelacion.` },
          { status: 400 }
        );
      }
    }

    // Verificar que la pista pertenece al club
    const pista = await db.court.findFirst({
      where: { id: courtId, clubId: auth.session.user.clubId },
    });
    if (!pista) {
      return NextResponse.json(
        { error: "Pista no encontrada." },
        { status: 404 }
      );
    }

    // Verificar solapamiento
    const solapamiento = await db.booking.findFirst({
      where: {
        courtId,
        status: { not: "cancelled" },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (solapamiento) {
      return NextResponse.json(
        { error: "Ese horario ya esta ocupado." },
        { status: 409 }
      );
    }

    const totalPrice = await calcularPrecioReserva(
      courtId,
      auth.session.user.clubId,
      startTime,
      endTime
    );

    // Crear booking + partida + inscripcion en transaccion
    const partida = await db.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          clubId: auth.session.user.clubId,
          courtId,
          startTime,
          endTime,
          totalPrice,
          status: "confirmed",
          paymentStatus: "exempt",
        },
      });

      const openMatch = await tx.openMatch.create({
        data: {
          clubId: auth.session.user.clubId,
          courtId,
          matchTime: startTime,
          levelMin: levelMin ? parseFloat(levelMin) : null,
          levelMax: levelMax ? parseFloat(levelMax) : null,
          status: "OPEN",
          bookingId: booking.id,
        },
      });

      // Inscribir al creador automaticamente
      await tx.openMatchPlayer.create({
        data: {
          openMatchId: openMatch.id,
          userId: auth.session.user.id,
        },
      });

      return openMatch;
    });

    // Notificar a todos los jugadores del club sobre la nueva partida
    notificarClub({
      tipo: "open_match_created",
      titulo: "Nueva partida abierta",
      mensaje: `Se ha creado una partida en ${pista.name} para el ${startTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`,
      clubId: auth.session.user.clubId,
      metadata: { openMatchId: partida.id },
      url: "/partidas",
      excluirUserId: auth.session.user.id,
    }).catch(() => {})

    return NextResponse.json(partida, { status: 201 });
  } catch (error) {
    console.error("[CREATE_PLAYER_OPEN_MATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
