import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { calcularPrecioReserva } from "@/lib/pricing";
import { crearNotificacion } from "@/lib/notifications";
import { enviarEmailConfirmacionReserva, enviarEmailCancelacionReserva } from "@/lib/email";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { validarBody } from "@/lib/validation";
import { liberarSlotYNotificar, limpiarWaitlistAlReservar } from "@/lib/waitlist";
import * as z from "zod";

const PlayerBookingCreateSchema = z.object({
  courtId: z.string().min(1, "El ID de pista es requerido."),
  startTime: z.string().min(1, "La hora de inicio es requerida."),
  endTime: z.string().min(1, "La hora de fin es requerida."),
  payAtClub: z.boolean().optional(),
})

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
    logger.error("GET_PLAYER_BOOKINGS", "Error obteniendo reservas del jugador", { ruta: "/api/player/bookings", metodo: "GET" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Crear reserva como jugador (solo para si mismo)
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("bookings:create")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(PlayerBookingCreateSchema, body);
    if (!result.success) return result.response;
    const { courtId, startTime, endTime, payAtClub } = result.data;

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
        stripeConnectOnboarded: true,
        slug: true,
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
        status: { not: "cancelled" },
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

    // Determinar estado de pago segun configuracion del club
    const modoOnline = club.bookingPaymentMode !== "presential" && club.stripeConnectOnboarded
    let paymentStatus: string
    if (club.bookingPaymentMode === "presential" || !club.stripeConnectOnboarded) {
      paymentStatus = "exempt"
    } else if (club.bookingPaymentMode === "both" && payAtClub) {
      paymentStatus = "pending" // pagara en el club
    } else {
      paymentStatus = "pending" // pagara online
    }

    const requiresPayment = modoOnline && !payAtClub && paymentStatus === "pending"

    const numPlayers = 4 // padel estandar: 2 vs 2

    const booking = await db.booking.create({
      data: {
        courtId,
        userId: auth.session.user.id,
        startTime: newStartTime,
        endTime: newEndTime,
        totalPrice,
        numPlayers,
        paymentStatus,
        status: "confirmed",
        clubId: auth.session.user.clubId,
      },
    });

    // Limpiar lista de espera del slot
    limpiarWaitlistAlReservar({ courtId, startTime: newStartTime, userId: auth.session.user.id }).catch(() => {})

    // Crear BookingPayments para tracking de pagos por jugador
    if (paymentStatus !== "exempt" && totalPrice > 0) {
      const amountBase = Math.floor((totalPrice / numPlayers) * 100) / 100
      const remainder = Math.round((totalPrice - amountBase * numPlayers) * 100) / 100
      const pagosData = [
        { bookingId: booking.id, userId: auth.session.user.id, guestName: null, amount: amountBase + remainder, clubId: auth.session.user.clubId },
        ...Array.from({ length: numPlayers - 1 }, (_, i) => ({
          bookingId: booking.id, userId: null, guestName: `Jugador ${i + 2}`, amount: amountBase, clubId: auth.session.user.clubId,
        })),
      ]
      db.bookingPayment.createMany({ data: pagosData }).catch(() => {})
    }

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

    // Email de confirmacion: solo enviar ahora si NO requiere pago online
    // Para pagos online, el email se envia desde el webhook tras confirmar el pago
    if (!requiresPayment) {
      const datosEmailConfirmacion = await db.user.findUnique({
        where: { id: auth.session.user.id },
        select: { email: true, name: true, club: { select: { name: true, slug: true } } },
      })
      if (datosEmailConfirmacion?.email) {
        enviarEmailConfirmacionReserva({
          email: datosEmailConfirmacion.email,
          nombre: datosEmailConfirmacion.name || "Jugador",
          pistaNombre: court.name,
          fechaHoraInicio: newStartTime,
          fechaHoraFin: newEndTime,
          precioTotal: totalPrice,
          estadoPago: booking.paymentStatus || "pending",
          clubNombre: datosEmailConfirmacion.club?.name || "",
          clubSlug: datosEmailConfirmacion.club?.slug || "",
        }).catch(() => {})
      }
    }

    return NextResponse.json({ ...booking, requiresPayment }, { status: 201 });
  } catch (error) {
    logger.error("CREATE_PLAYER_BOOKING", "Error creando reserva de jugador", { ruta: "/api/player/bookings", metodo: "POST" }, error);
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
      include: { court: { select: { name: true } } },
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
      select: { cancellationHours: true, slug: true, name: true },
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

    // Reembolso automatico si la reserva fue pagada online
    const payment = await db.payment.findUnique({
      where: { bookingId },
      select: { id: true, stripePaymentId: true, status: true, amount: true },
    })

    if (payment?.stripePaymentId && payment.status === "succeeded") {
      try {
        await stripe.refunds.create({
          payment_intent: payment.stripePaymentId,
          refund_application_fee: false, // la plataforma absorbe la comision perdida
        })
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "refunded" },
        })
        logger.info("BOOKING_REFUND", "Reembolso procesado por cancelacion", {
          bookingId,
          paymentId: payment.id,
          amount: payment.amount,
        })
      } catch (refundError) {
        // Loguear error pero no bloquear la cancelacion
        logger.error("BOOKING_REFUND", "Error al procesar reembolso", { bookingId, paymentId: payment.id }, refundError)
      }
    }

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

    // Enviar email de cancelacion (no bloquear si falla)
    const datosEmailCancelacion = await db.user.findUnique({
      where: { id: auth.session.user.id },
      select: { email: true, name: true, club: { select: { name: true, slug: true } } },
    })
    if (datosEmailCancelacion?.email) {
      enviarEmailCancelacionReserva({
        email: datosEmailCancelacion.email,
        nombre: datosEmailCancelacion.name || "Jugador",
        pistaNombre: reserva.court?.name || "Pista",
        fechaHoraInicio: reserva.startTime,
        precioTotal: reserva.totalPrice,
        clubNombre: datosEmailCancelacion.club?.name || "",
        clubSlug: datosEmailCancelacion.club?.slug || "",
      }).catch(() => {})
    }

    // Notificar lista de espera del slot liberado
    liberarSlotYNotificar({
      courtId: reserva.courtId,
      startTime: reserva.startTime,
      endTime: reserva.endTime,
      clubId: auth.session.user.clubId,
      clubSlug: club?.slug || "",
      clubNombre: club?.name || "",
      pistaNombre: reserva.court?.name || "Pista",
    }).catch(() => {})

    return NextResponse.json({ message: "Reserva cancelada correctamente." });
  } catch (error) {
    logger.error("CANCEL_PLAYER_BOOKING", "Error cancelando reserva de jugador", { ruta: "/api/player/bookings", metodo: "DELETE" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
