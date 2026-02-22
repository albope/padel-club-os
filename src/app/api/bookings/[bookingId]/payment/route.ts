import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"

// PATCH: Marcar pago de reserva como cobrado
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

    if (booking.paymentStatus === "paid") {
      return new NextResponse("Esta reserva ya esta marcada como pagada", { status: 400 })
    }

    const updatedBooking = await db.booking.update({
      where: { id: params.bookingId },
      data: { paymentStatus: "paid" },
      include: {
        user: { select: { name: true } },
        court: { select: { name: true } },
      },
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error("[UPDATE_BOOKING_PAYMENT_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
