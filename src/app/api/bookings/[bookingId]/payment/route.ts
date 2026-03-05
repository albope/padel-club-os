import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { asegurarBookingPayments } from "@/lib/payment-sync"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

// PATCH: Marcar pago de reserva como cobrado (todos los jugadores a la vez)
export async function PATCH(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const auth = await requireAuth("bookings:update")
    if (isAuthError(auth)) return auth

    if (!params.bookingId) {
      return new NextResponse("ID de reserva requerido", { status: 400 })
    }

    const booking = await db.booking.findUnique({
      where: { id: params.bookingId, clubId: auth.session.user.clubId },
    })

    if (!booking) {
      return new NextResponse("Reserva no encontrada", { status: 404 })
    }

    // Guard: bloquear cobro en reservas exentas
    if (booking.paymentMethod === "exempt" || booking.paymentStatus === "exempt") {
      return NextResponse.json({ error: "No se puede cobrar una reserva exenta." }, { status: 400 })
    }

    if (booking.paymentStatus === "paid") {
      return new NextResponse("Esta reserva ya esta marcada como pagada", { status: 400 })
    }

    // Guard: bloquear cobro si booking cancelada o reembolsada
    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "No se puede cobrar una reserva cancelada." }, { status: 400 })
    }
    if (booking.paymentStatus === "refunded") {
      return NextResponse.json({ error: "No se puede cobrar una reserva reembolsada." }, { status: 400 })
    }

    const now = new Date()

    const updatedBooking = await db.$transaction(async (tx) => {
      // Asegurar que existen BookingPayments antes de marcar paid
      await asegurarBookingPayments(tx, params.bookingId)

      // Marcar la reserva como pagada
      const updated = await tx.booking.update({
        where: { id: params.bookingId },
        data: { paymentStatus: "paid" },
        include: {
          user: { select: { name: true } },
          court: { select: { name: true } },
        },
      })

      // Sincronizar BookingPayments: marcar todos como pagados
      await tx.bookingPayment.updateMany({
        where: { bookingId: params.bookingId, status: "pending" },
        data: {
          status: "paid",
          paidAt: now,
          collectedById: auth.session.user.id,
        },
      })

      return updated
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    logger.error("BOOKING_PAYMENT", "Error al cobrar reserva completa", { bookingId: params.bookingId }, error as Error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
