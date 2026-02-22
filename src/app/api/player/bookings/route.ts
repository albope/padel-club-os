import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { calcularPrecioReserva } from "@/lib/pricing";
import { crearNotificacion } from "@/lib/notifications";

// GET: Obtener reservas del jugador autenticado
export async function GET() {
  try {
    const auth = await requireAuth("bookings:read")
    if (isAuthError(auth)) return auth

    const bookings = await db.booking.findMany({
      where: {
        userId: auth.session.user.id,
        clubId: auth.session.user.clubId,
      },
      include: {
        court: { select: { name: true, type: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("[GET_PLAYER_BOOKINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Crear reserva como jugador (solo para si mismo)
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("bookings:create")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { courtId, startTime, endTime } = body;

    if (!courtId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (courtId, startTime, endTime)." },
        { status: 400 }
      );
    }

    // Verificar configuracion del club
    const club = await db.club.findUnique({
      where: { id: auth.session.user.clubId },
      select: {
        enablePlayerBooking: true,
        maxAdvanceBooking: true,
        cancellationHours: true,
        openingTime: true,
        closingTime: true,
        bookingPaymentMode: true,
      },
    });

    if (!club?.enablePlayerBooking) {
      return NextResponse.json(
        { error: "Las reservas online no estan habilitadas en este club." },
        { status: 403 }
      );
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);
    const now = new Date();

    // Verificar que no sea en el pasado
    if (newStartTime < now) {
      return NextResponse.json(
        { error: "No puedes reservar en el pasado." },
        { status: 400 }
      );
    }

    // Verificar ventana maxima de reserva anticipada
    if (club.maxAdvanceBooking) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + club.maxAdvanceBooking);
      if (newStartTime > maxDate) {
        return NextResponse.json(
          { error: `Solo puedes reservar con ${club.maxAdvanceBooking} dias de antelacion.` },
          { status: 400 }
        );
      }
    }

    // Verificar solapamiento
    const overlapping = await db.booking.findFirst({
      where: {
        courtId,
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "Este horario ya esta ocupado." },
        { status: 409 }
      );
    }

    // Verificar que la pista pertenece al club
    const court = await db.court.findFirst({
      where: { id: courtId, clubId: auth.session.user.clubId },
    });
    if (!court) {
      return NextResponse.json(
        { error: "Pista no encontrada." },
        { status: 404 }
      );
    }

    const totalPrice = await calcularPrecioReserva(courtId, auth.session.user.clubId, newStartTime, newEndTime);

    const booking = await db.booking.create({
      data: {
        courtId,
        userId: auth.session.user.id,
        startTime: newStartTime,
        endTime: newEndTime,
        totalPrice,
        paymentStatus: club.bookingPaymentMode === "presential" ? "exempt" : "pending",
        status: "confirmed",
        clubId: auth.session.user.clubId,
      },
    });

    // Notificar al jugador de la confirmacion
    crearNotificacion({
      tipo: "booking_confirmed",
      titulo: "Reserva confirmada",
      mensaje: `Tu reserva en ${court.name} para el ${newStartTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${newStartTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ha sido confirmada.`,
      userId: auth.session.user.id,
      clubId: auth.session.user.clubId,
      metadata: { bookingId: booking.id },
      url: "/reservar",
    }).catch(() => {})

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[CREATE_PLAYER_BOOKING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Cancelar una reserva propia
export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth("bookings:read");
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { error: "ID de reserva requerido." },
        { status: 400 }
      );
    }

    const reserva = await db.booking.findFirst({
      where: {
        id: bookingId,
        userId: auth.session.user.id,
        clubId: auth.session.user.clubId,
        status: "confirmed",
      },
    });

    if (!reserva) {
      return NextResponse.json(
        { error: "Reserva no encontrada." },
        { status: 404 }
      );
    }

    if (new Date(reserva.startTime) < new Date()) {
      return NextResponse.json(
        { error: "No puedes cancelar una reserva pasada." },
        { status: 400 }
      );
    }

    const club = await db.club.findUnique({
      where: { id: auth.session.user.clubId },
      select: { cancellationHours: true },
    });

    if (club?.cancellationHours) {
      const limite = new Date(
        new Date(reserva.startTime).getTime() - club.cancellationHours * 3600000
      );
      if (new Date() > limite) {
        return NextResponse.json(
          {
            error: `Solo puedes cancelar con ${club.cancellationHours} horas de antelacion.`,
          },
          { status: 400 }
        );
      }
    }

    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "Cancelado por el jugador",
      },
    });

    // Notificar al jugador de la cancelacion
    crearNotificacion({
      tipo: "booking_cancelled",
      titulo: "Reserva cancelada",
      mensaje: "Tu reserva ha sido cancelada correctamente.",
      userId: auth.session.user.id,
      clubId: auth.session.user.clubId,
      metadata: { bookingId },
      url: "/reservar",
    }).catch(() => {})

    return NextResponse.json({ message: "Reserva cancelada correctamente." });
  } catch (error) {
    console.error("[CANCEL_PLAYER_BOOKING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
