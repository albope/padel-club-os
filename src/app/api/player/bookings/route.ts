import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { calcularPrecioReserva } from "@/lib/pricing";
import { crearNotificacion } from "@/lib/notifications";
import { enviarEmailConfirmacionReserva, enviarEmailCancelacionReserva } from "@/lib/email";
import { generarDatosPagoPorJugador } from "@/lib/payment-sync";
import { stripe } from "@/lib/stripe";
import { enqueueBookingRefund } from "@/lib/refunds";
import { logger } from "@/lib/logger";
import { validarBody } from "@/lib/validation";
import { liberarSlotYNotificar, limpiarWaitlistAlReservar } from "@/lib/waitlist";
import { verificarBloqueo } from "@/lib/court-blocks";
import { registrarAuditoria } from "@/lib/audit";
import * as z from "zod";
import { respuestaErrorReserva, validarRangoReserva } from "@/lib/booking-domain";

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
        name: true,
        timezone: true,
        bookingDuration: true,
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
    validarRangoReserva({
      startTime: newStartTime,
      endTime: newEndTime,
      policy: club,
      now,
      requireFuture: true,
    })

    // Comprobar propiedad antes de consultar disponibilidad evita filtrar si
    // una pista de otro club esta ocupada.
    const court = await db.court.findFirst({
      where: { id: courtId, clubId: auth.session.user.clubId },
    });
    if (!court) {
      return NextResponse.json(
        { error: "Pista no encontrada." },
        { status: 404 }
      );
    }

    // Verificar solapamiento
    const overlapping = await db.booking.findFirst({
      where: {
        courtId,
        clubId: auth.session.user.clubId,
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

    // Verificar bloqueo de pista
    const bloqueo = await verificarBloqueo(auth.session.user.clubId, courtId, newStartTime, newEndTime);
    if (bloqueo) {
      return NextResponse.json(
        { error: `La pista esta bloqueada en ese horario (${bloqueo.reason}${bloqueo.note ? `: ${bloqueo.note}` : ""}).` },
        { status: 409 }
      );
    }

    const totalPrice = await calcularPrecioReserva(courtId, auth.session.user.clubId, newStartTime, newEndTime);
    if (totalPrice <= 0) {
      return NextResponse.json(
        {
          error:
            "Este horario no tiene una tarifa completa configurada. Contacta con el club.",
          code: "PRICE_NOT_CONFIGURED",
        },
        { status: 409 },
      )
    }

    // Determinar metodo y estado de pago segun configuracion del club
    let paymentMethod: string
    if (club.bookingPaymentMode === "presential" || !club.stripeConnectOnboarded) {
      paymentMethod = "presential"
    } else if (club.bookingPaymentMode === "both" && payAtClub) {
      paymentMethod = "presential"
    } else {
      paymentMethod = "online"
    }
    const paymentStatus = "pending"
    const requiresPayment = paymentMethod === "online"

    const numPlayers = 4 // padel estandar: 2 vs 2

    // Crear Booking + BookingPayments en una sola transaccion
    const booking = await db.$transaction(async (tx) => {
      const nuevaReserva = await tx.booking.create({
        data: {
          courtId,
          userId: auth.session.user.id,
          startTime: newStartTime,
          endTime: newEndTime,
          totalPrice,
          numPlayers,
          paymentStatus,
          paymentMethod,
          status: "confirmed",
          clubId: auth.session.user.clubId,
        },
      })

      // Crear BookingPayments dentro de la transaccion (no fire-and-forget)
      if (totalPrice > 0) {
        const pagosData = generarDatosPagoPorJugador({
          bookingId: nuevaReserva.id,
          clubId: auth.session.user.clubId,
          totalPrice,
          numPlayers,
          titularUserId: auth.session.user.id,
        })
        await tx.bookingPayment.createMany({ data: pagosData })
      }

      return nuevaReserva
    })

    // Limpiar lista de espera del slot
    await limpiarWaitlistAlReservar({ courtId, startTime: newStartTime, userId: auth.session.user.id })

    registrarAuditoria({
      recurso: "booking",
      accion: "crear",
      entidadId: booking.id,
      detalles: { pistaId: courtId, fecha: startTime, hora: startTime },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    // Notificar al jugador de la confirmacion
    await crearNotificacion({
      tipo: "booking_confirmed",
      titulo: "Reserva confirmada",
      mensaje: `Tu reserva en ${court.name} para el ${newStartTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${newStartTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ha sido confirmada.`,
      userId: auth.session.user.id,
      clubId: auth.session.user.clubId,
      metadata: { bookingId: booking.id },
      url: "/reservar",
    })

    // Email de confirmacion: solo enviar ahora si NO requiere pago online
    // Para pagos online, el email se envia desde el webhook tras confirmar el pago
    if (!requiresPayment) {
      const datosEmailConfirmacion = await db.user.findUnique({
        where: { id: auth.session.user.id },
        select: { email: true, name: true, club: { select: { name: true, slug: true } } },
      })
      if (datosEmailConfirmacion?.email) {
        await enviarEmailConfirmacionReserva({
          email: datosEmailConfirmacion.email,
          nombre: datosEmailConfirmacion.name || "Jugador",
          pistaNombre: court.name,
          fechaHoraInicio: newStartTime,
          fechaHoraFin: newEndTime,
          precioTotal: totalPrice,
          estadoPago: booking.paymentStatus || "pending",
          clubNombre: club.name || "",
          clubSlug: club.slug || "",
        }).catch((emailError) => {
          logger.error("BOOKING_CONFIRMATION_EMAIL", "No se pudo enviar la confirmacion", { bookingId: booking.id }, emailError)
        })
      }
    }

    return NextResponse.json({ ...booking, requiresPayment }, { status: 201 });
  } catch (error) {
    const domainError = respuestaErrorReserva(error)
    if (domainError) {
      return NextResponse.json(
        { error: domainError.message, code: domainError.code },
        { status: domainError.status },
      )
    }
    logger.error("CREATE_PLAYER_BOOKING", "Error creando reserva de jugador", { ruta: "/api/player/bookings", metodo: "POST" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Cancelar una reserva propia
export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth("bookings:cancel-own");
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

    // Expirar Checkout Session activa si existe (antes de cancelar)
    if (reserva.checkoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(reserva.checkoutSessionId)
      } catch {
        // Session ya expirada o completada
      }
    }

    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "Cancelado por el jugador",
        checkoutSessionId: null,
        checkoutSessionExpiresAt: null,
        checkoutLockUntil: null,
      },
    });

    // Registrar la obligacion antes de invocar Stripe. Si el proveedor no
    // responde, el cron reintenta con la misma clave de idempotencia.
    let refundStatus: "not_needed" | "already_refunded" | "pending" | "succeeded" | "failed" = "not_needed"
    try {
      refundStatus = (await enqueueBookingRefund(bookingId, "Cancelado por el jugador")).status
    } catch (refundError) {
      refundStatus = "pending"
      logger.error("BOOKING_REFUND_QUEUE", "No se pudo registrar el reembolso inmediatamente", { bookingId }, refundError)
    }

    registrarAuditoria({
      recurso: "booking",
      accion: "cancelar",
      entidadId: bookingId,
      detalles: { pistaId: reserva.courtId, fecha: reserva.startTime },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    // Notificar al jugador de la cancelacion
    await crearNotificacion({
      tipo: "booking_cancelled",
      titulo: "Reserva cancelada",
      mensaje: "Tu reserva ha sido cancelada correctamente.",
      userId: auth.session.user.id,
      clubId: auth.session.user.clubId,
      metadata: { bookingId },
      url: "/reservar",
    })

    // Enviar email de cancelacion (no bloquear si falla)
    const datosEmailCancelacion = await db.user.findUnique({
      where: { id: auth.session.user.id },
      select: { email: true, name: true, club: { select: { name: true, slug: true } } },
    })
    if (datosEmailCancelacion?.email) {
      await enviarEmailCancelacionReserva({
        email: datosEmailCancelacion.email,
        nombre: datosEmailCancelacion.name || "Jugador",
        pistaNombre: reserva.court?.name || "Pista",
        fechaHoraInicio: reserva.startTime,
        precioTotal: reserva.totalPrice,
        clubNombre: datosEmailCancelacion.club?.name || "",
        clubSlug: datosEmailCancelacion.club?.slug || "",
      }).catch((emailError) => {
        logger.error("BOOKING_CANCELLATION_EMAIL", "No se pudo enviar la cancelacion", { bookingId }, emailError)
      })
    }

    // Notificar lista de espera del slot liberado
    await liberarSlotYNotificar({
      courtId: reserva.courtId,
      startTime: reserva.startTime,
      endTime: reserva.endTime,
      clubId: auth.session.user.clubId,
      clubSlug: club?.slug || "",
      clubNombre: club?.name || "",
      pistaNombre: reserva.court?.name || "Pista",
    })

    return NextResponse.json({
      message: refundStatus === "failed" || refundStatus === "pending"
        ? "Reserva cancelada. El reembolso esta pendiente de confirmacion."
        : "Reserva cancelada correctamente.",
      refundStatus,
    });
  } catch (error) {
    logger.error("CANCEL_PLAYER_BOOKING", "Error cancelando reserva de jugador", { ruta: "/api/player/bookings", metodo: "DELETE" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
