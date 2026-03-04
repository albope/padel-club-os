import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { calcularPrecioReserva } from "@/lib/pricing"
import { crearNotificacion } from "@/lib/notifications"
import { enviarEmailReagendamientoReserva } from "@/lib/email"
import { liberarSlotYNotificar, limpiarWaitlistAlReservar } from "@/lib/waitlist"
import { logger } from "@/lib/logger"
import { validarBody } from "@/lib/validation"
import * as z from "zod"

const RescheduleSchema = z.object({
  newCourtId: z.string().min(1).optional(),
  newStartTime: z.string().min(1, "La nueva hora de inicio es requerida."),
  newEndTime: z.string().min(1, "La nueva hora de fin es requerida."),
})

// PATCH: Reagendar una reserva propia (cancel + rebook atomico)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const auth = await requireAuth("bookings:create")
    if (isAuthError(auth)) return auth

    const { bookingId } = await params
    const body = await req.json()
    const result = validarBody(RescheduleSchema, body)
    if (!result.success) return result.response
    const { newCourtId, newStartTime, newEndTime } = result.data

    const clubId = auth.session.user.clubId
    const userId = auth.session.user.id

    // Obtener reserva original
    const reservaOriginal = await db.booking.findFirst({
      where: {
        id: bookingId,
        userId,
        clubId,
        status: "confirmed",
      },
      include: { court: { select: { name: true } } },
    })

    if (!reservaOriginal) {
      return NextResponse.json(
        { error: "Reserva no encontrada." },
        { status: 404 }
      )
    }

    // Verificar que la reserva original es futura
    if (new Date(reservaOriginal.startTime) < new Date()) {
      return NextResponse.json(
        { error: "No puedes modificar una reserva pasada." },
        { status: 400 }
      )
    }

    // Verificar politica de cancelacion
    const club = await db.club.findUnique({
      where: { id: clubId },
      select: {
        cancellationHours: true,
        maxAdvanceBooking: true,
        enablePlayerBooking: true,
        slug: true,
        name: true,
      },
    })

    if (!club?.enablePlayerBooking) {
      return NextResponse.json(
        { error: "Las reservas online no estan habilitadas en este club." },
        { status: 403 }
      )
    }

    if (club.cancellationHours) {
      const limite = new Date(
        new Date(reservaOriginal.startTime).getTime() - club.cancellationHours * 3600000
      )
      if (new Date() > limite) {
        return NextResponse.json(
          { error: `Solo puedes modificar con ${club.cancellationHours} horas de antelacion.` },
          { status: 400 }
        )
      }
    }

    const nuevaStartTime = new Date(newStartTime)
    const nuevaEndTime = new Date(newEndTime)
    const now = new Date()

    // Verificar que el nuevo horario no sea en el pasado
    if (nuevaStartTime < now) {
      return NextResponse.json(
        { error: "No puedes reagendar a un horario pasado." },
        { status: 400 }
      )
    }

    // Verificar ventana maxima de reserva anticipada
    if (club.maxAdvanceBooking) {
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + club.maxAdvanceBooking)
      if (nuevaStartTime > maxDate) {
        return NextResponse.json(
          { error: `Solo puedes reservar con ${club.maxAdvanceBooking} dias de antelacion.` },
          { status: 400 }
        )
      }
    }

    const courtIdDestino = newCourtId || reservaOriginal.courtId

    // Verificar que la pista destino pertenece al club
    const pistaDestino = await db.court.findFirst({
      where: { id: courtIdDestino, clubId },
    })
    if (!pistaDestino) {
      return NextResponse.json(
        { error: "Pista no encontrada." },
        { status: 404 }
      )
    }

    // Verificar solapamiento en el nuevo horario (excluyendo la reserva actual)
    const overlapping = await db.booking.findFirst({
      where: {
        courtId: courtIdDestino,
        status: { not: "cancelled" },
        id: { not: bookingId },
        AND: [
          { startTime: { lt: nuevaEndTime } },
          { endTime: { gt: nuevaStartTime } },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json(
        { error: "El nuevo horario ya esta ocupado." },
        { status: 409 }
      )
    }

    // Calcular nuevo precio
    const nuevoPrecio = await calcularPrecioReserva(courtIdDestino, clubId, nuevaStartTime, nuevaEndTime)

    // Transaccion atomica: cancelar la original + crear la nueva
    const [, nuevaReserva] = await db.$transaction([
      // Cancelar la reserva original
      db.booking.update({
        where: { id: bookingId },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason: "Reagendada por el jugador",
        },
      }),
      // Crear la nueva reserva
      db.booking.create({
        data: {
          courtId: courtIdDestino,
          userId,
          startTime: nuevaStartTime,
          endTime: nuevaEndTime,
          totalPrice: nuevoPrecio,
          numPlayers: reservaOriginal.numPlayers,
          paymentStatus: reservaOriginal.paymentStatus || "exempt",
          status: "confirmed",
          clubId,
        },
      }),
    ])

    // Notificar lista de espera del slot liberado (fire-and-forget)
    liberarSlotYNotificar({
      courtId: reservaOriginal.courtId,
      startTime: reservaOriginal.startTime,
      endTime: reservaOriginal.endTime,
      clubId,
      clubSlug: club.slug || "",
      clubNombre: club.name || "",
      pistaNombre: reservaOriginal.court?.name || "Pista",
    }).catch(() => {})

    // Limpiar waitlist del nuevo slot
    limpiarWaitlistAlReservar({ courtId: courtIdDestino, startTime: nuevaStartTime, userId }).catch(() => {})

    // Crear BookingPayments para la nueva reserva
    if (reservaOriginal.paymentStatus !== "exempt" && nuevoPrecio > 0) {
      const numPlayers = reservaOriginal.numPlayers || 4
      const amountBase = Math.floor((nuevoPrecio / numPlayers) * 100) / 100
      const remainder = Math.round((nuevoPrecio - amountBase * numPlayers) * 100) / 100
      const pagosData = [
        { bookingId: nuevaReserva.id, userId, guestName: null, amount: amountBase + remainder, clubId },
        ...Array.from({ length: numPlayers - 1 }, (_, i) => ({
          bookingId: nuevaReserva.id, userId: null, guestName: `Jugador ${i + 2}`, amount: amountBase, clubId,
        })),
      ]
      db.bookingPayment.createMany({ data: pagosData }).catch(() => {})
    }

    // Notificacion in-app + push
    crearNotificacion({
      tipo: "booking_rescheduled",
      titulo: "Reserva modificada",
      mensaje: `Tu reserva ha sido cambiada a ${pistaDestino.name} el ${nuevaStartTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${nuevaStartTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`,
      userId,
      clubId,
      metadata: { bookingId: nuevaReserva.id, originalBookingId: bookingId },
      url: "/reservar",
    }).catch(() => {})

    // Email de reagendamiento
    const datosEmail = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, club: { select: { name: true, slug: true } } },
    })
    if (datosEmail?.email) {
      enviarEmailReagendamientoReserva({
        email: datosEmail.email,
        nombre: datosEmail.name || "Jugador",
        pistaNombreAnterior: reservaOriginal.court?.name || "Pista",
        fechaHoraInicioAnterior: reservaOriginal.startTime,
        fechaHoraFinAnterior: reservaOriginal.endTime,
        pistaNombreNueva: pistaDestino.name,
        fechaHoraInicioNueva: nuevaStartTime,
        fechaHoraFinNueva: nuevaEndTime,
        precioTotal: nuevoPrecio,
        estadoPago: nuevaReserva.paymentStatus || "exempt",
        clubNombre: datosEmail.club?.name || "",
        clubSlug: datosEmail.club?.slug || "",
      }).catch(() => {})
    }

    return NextResponse.json(nuevaReserva)
  } catch (error) {
    logger.error("RESCHEDULE_BOOKING", "Error reagendando reserva", { ruta: "/api/player/bookings/[bookingId]/reschedule", metodo: "PATCH" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
