import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { crearNotificacion } from "@/lib/notifications"
import { enviarEmailCancelacionReserva } from "@/lib/email"
import { stripe } from "@/lib/stripe"
import { aplicarRefundBooking } from "@/lib/payment-sync"
import type { CourtBlock, CourtBlockReason } from "@prisma/client"

// --- verificarBloqueo ---
// Busca si existe un bloqueo activo que solape con el rango dado.
// courtId null en DB = bloqueo club-wide (aplica a todas las pistas).
export async function verificarBloqueo(
  clubId: string,
  courtId: string,
  startTime: Date,
  endTime: Date
): Promise<CourtBlock | null> {
  return db.courtBlock.findFirst({
    where: {
      clubId,
      OR: [
        { courtId },
        { courtId: null }, // bloqueo club-wide
      ],
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  })
}

// --- obtenerBloqueosDia ---
// Obtiene todos los bloqueos que solapan con un dia concreto (overlap, no containment).
export async function obtenerBloqueosDia(
  clubId: string,
  fechaInicio: Date
): Promise<CourtBlock[]> {
  const fechaFin = new Date(fechaInicio)
  fechaFin.setHours(23, 59, 59, 999)

  return db.courtBlock.findMany({
    where: {
      clubId,
      startTime: { lt: new Date(fechaFin.getTime() + 1) },
      endTime: { gt: fechaInicio },
    },
  })
}

// --- Tipo de conflicto para respuestas API ---
export interface ConflictoBloqueo {
  bookingId: string
  courtName: string
  startTime: string
  endTime: string
  userName: string | null
  guestName: string | null
  tipo: "reserva" | "partida-abierta"
}

// Include config para bookings con detalle (reutilizado para tipar el resultado)
const bookingConDetalleInclude = {
  court: { select: { name: true } },
  user: { select: { id: true, name: true, email: true } },
  openMatch: {
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  },
  payment: { select: { id: true, stripePaymentId: true, status: true, amount: true } },
} as const

// Tipo interno para bookings con todas las relaciones necesarias
import type { Prisma } from "@prisma/client"
type BookingConDetalle = Prisma.BookingGetPayload<{ include: typeof bookingConDetalleInclude }>

// --- buscarConflictos ---
// Busca bookings activas (con openMatch incluido) que solapan con el rango.
// Devuelve lista deduplicada: cada OpenMatch se deriva de su Booking.
export async function buscarConflictos(
  clubId: string,
  courtId: string | null,
  startTime: Date,
  endTime: Date
): Promise<{
  conflictos: ConflictoBloqueo[]
  bookingsConDetalle: BookingConDetalle[]
}> {
  const whereClause: Record<string, unknown> = {
    clubId,
    status: { not: "cancelled" },
    AND: [
      { startTime: { lt: endTime } },
      { endTime: { gt: startTime } },
    ],
  }
  // Si courtId especifico, filtrar por pista. Si null, buscar en todas.
  if (courtId) {
    whereClause.courtId = courtId
  }

  const bookings = await db.booking.findMany({
    where: whereClause,
    include: bookingConDetalleInclude,
  })

  const conflictos: ConflictoBloqueo[] = bookings.map((b) => ({
    bookingId: b.id,
    courtName: b.court.name,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    userName: b.user?.name ?? null,
    guestName: b.guestName,
    tipo: b.openMatch ? "partida-abierta" : "reserva",
  }))

  return { conflictos, bookingsConDetalle: bookings }
}

// --- cancelarReservasPorBloqueo ---
// Cancela bookings + openMatches en transaccion DB.
// Notificaciones, emails y refunds son fire-and-forget post-commit.
export async function cancelarReservasPorBloqueo(
  bookings: BookingConDetalle[],
  reason: CourtBlockReason,
  note: string | null,
  clubId: string
): Promise<{ canceladas: number }> {
  if (bookings.length === 0) return { canceladas: 0 }

  const motivoTexto = traducirMotivo(reason)
  const cancelReason = `Bloqueo de pista: ${motivoTexto}${note ? ` - ${note}` : ""}`

  // Transaccion: solo escrituras DB
  await db.$transaction(async (tx) => {
    for (const booking of bookings) {
      // Cancelar OpenMatch si existe
      if (booking.openMatch) {
        await tx.openMatch.update({
          where: { id: booking.openMatch.id },
          data: { status: "CANCELLED" },
        })
      }

      // Soft-delete booking
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason,
          checkoutSessionId: null,
          checkoutSessionExpiresAt: null,
          checkoutLockUntil: null,
        },
      })
    }

    // Expirar waitlist entries de los slots afectados (NO liberar - slot sigue bloqueado)
    for (const booking of bookings) {
      await tx.bookingWaitlist.updateMany({
        where: {
          courtId: booking.courtId,
          startTime: booking.startTime,
          clubId,
          status: { in: ["active", "notified"] },
        },
        data: { status: "expired" },
      })
    }
  })

  // Fire-and-forget: notificaciones, emails, refunds
  for (const booking of bookings) {
    procesarPostCancelacion(booking, cancelReason, clubId).catch((err) => {
      logger.error("COURT_BLOCK_POST_CANCEL", "Error en post-cancelacion", { bookingId: booking.id }, err)
    })
  }

  return { canceladas: bookings.length }
}

// --- Helpers internos ---

async function procesarPostCancelacion(
  booking: BookingConDetalle,
  cancelReason: string,
  clubId: string
) {
  // Obtener datos del club para emails
  const club = await db.club.findUnique({
    where: { id: clubId },
    select: { name: true, slug: true },
  })

  // 1. Si es OpenMatch, notificar a todos los jugadores inscritos
  if (booking.openMatch) {
    for (const player of booking.openMatch.players) {
      crearNotificacion({
        tipo: "open_match_cancelled",
        titulo: "Partida cancelada",
        mensaje: `Tu partida en ${booking.court.name} ha sido cancelada. Motivo: ${cancelReason}`,
        userId: player.userId,
        clubId,
        metadata: { bookingId: booking.id, openMatchId: booking.openMatch.id },
        url: "/partidas",
      }).catch(() => {})

      if (player.user.email) {
        enviarEmailCancelacionReserva({
          email: player.user.email,
          nombre: player.user.name || "Jugador",
          pistaNombre: booking.court.name,
          fechaHoraInicio: booking.startTime,
          precioTotal: booking.totalPrice,
          clubNombre: club?.name || "",
          clubSlug: club?.slug || "",
        }).catch(() => {})
      }
    }
  } else if (booking.user) {
    // 2. Reserva normal: notificar al titular
    crearNotificacion({
      tipo: "booking_cancelled",
      titulo: "Reserva cancelada",
      mensaje: `Tu reserva en ${booking.court.name} ha sido cancelada. Motivo: ${cancelReason}`,
      userId: booking.user.id,
      clubId,
      metadata: { bookingId: booking.id },
      url: "/reservar",
    }).catch(() => {})

    if (booking.user.email) {
      enviarEmailCancelacionReserva({
        email: booking.user.email,
        nombre: booking.user.name || "Jugador",
        pistaNombre: booking.court.name,
        fechaHoraInicio: booking.startTime,
        precioTotal: booking.totalPrice,
        clubNombre: club?.name || "",
        clubSlug: club?.slug || "",
      }).catch(() => {})
    }
  }

  // 3. Refund si pago online
  if (booking.payment?.stripePaymentId && booking.payment.status === "succeeded") {
    try {
      await stripe.refunds.create({
        payment_intent: booking.payment.stripePaymentId,
        refund_application_fee: false,
      })
      await db.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: booking.payment!.id },
          data: { status: "refunded" },
        })
        await aplicarRefundBooking(tx, booking.id)
      })
      logger.info("COURT_BLOCK_REFUND", "Reembolso procesado por bloqueo", {
        bookingId: booking.id,
        paymentId: booking.payment.id,
        amount: booking.payment.amount,
      })
    } catch (refundError) {
      logger.error("COURT_BLOCK_REFUND", "Error al procesar reembolso por bloqueo", {
        bookingId: booking.id,
        paymentId: booking.payment.id,
      }, refundError)
    }
  }

  // 4. Expirar checkout session si activa
  if (booking.checkoutSessionId) {
    try {
      await stripe.checkout.sessions.expire(booking.checkoutSessionId)
    } catch {
      // Session ya expirada o completada
    }
  }
}

export function traducirMotivo(reason: CourtBlockReason): string {
  const mapa: Record<CourtBlockReason, string> = {
    MAINTENANCE: "Mantenimiento",
    HOLIDAY: "Festivo",
    EVENT: "Evento",
    OTHER: "Otro",
  }
  return mapa[reason] || reason
}
