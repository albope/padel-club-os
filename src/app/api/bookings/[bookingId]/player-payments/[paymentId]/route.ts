import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { validarBody } from "@/lib/validation"
import { sincronizarEstadoPago } from "@/lib/payment-sync"
import { logger } from "@/lib/logger"
import * as z from "zod"

const UpdatePlayerPaymentSchema = z.object({
  status: z.enum(["paid", "pending"], {
    errorMap: () => ({ message: "Estado debe ser 'paid' o 'pending'." }),
  }).optional(),
  guestName: z.string().max(100, "Nombre demasiado largo.").optional(),
})

// PATCH: Marcar pago individual de jugador como pagado/pendiente o editar nombre
export async function PATCH(
  req: Request,
  { params }: { params: { bookingId: string; paymentId: string } }
) {
  try {
    const auth = await requireAuth("booking-payments:update")
    if (isAuthError(auth)) return auth

    const { bookingId, paymentId } = params
    const body = await req.json()
    const result = validarBody(UpdatePlayerPaymentSchema, body)
    if (!result.success) return result.response
    const { status, guestName } = result.data

    if (!status && guestName === undefined) {
      return NextResponse.json({ error: "Se requiere al menos un campo para actualizar." }, { status: 400 })
    }

    // Guard: bloquear modificacion de pagos en reservas exentas
    const bookingCheck = await db.booking.findUnique({
      where: { id: bookingId, clubId: auth.session.user.clubId },
      select: { paymentMethod: true, paymentStatus: true },
    })
    if (!bookingCheck) {
      return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 })
    }
    if (bookingCheck.paymentMethod === "exempt" || bookingCheck.paymentStatus === "exempt") {
      return NextResponse.json({ error: "No se pueden modificar pagos de una reserva exenta." }, { status: 400 })
    }
    if (bookingCheck.paymentStatus === "refunded") {
      return NextResponse.json({ error: "No se pueden modificar pagos de una reserva reembolsada." }, { status: 400 })
    }

    // Transaccion atomica para evitar race conditions
    const updatedPayment = await db.$transaction(async (tx) => {
      // Verificar que el pago existe y pertenece al club
      const payment = await tx.bookingPayment.findFirst({
        where: {
          id: paymentId,
          bookingId,
          clubId: auth.session.user.clubId,
        },
      })

      if (!payment) {
        throw new Error("NOT_FOUND")
      }

      // Preparar datos de actualizacion
      const updateData: {
        status?: string
        paidAt?: Date | null
        collectedById?: string | null
        guestName?: string
      } = {}

      if (status === "paid") {
        updateData.status = "paid"
        updateData.paidAt = new Date()
        updateData.collectedById = auth.session.user.id
      } else if (status === "pending") {
        updateData.status = "pending"
        updateData.paidAt = null
        updateData.collectedById = null
      }

      if (guestName !== undefined) {
        updateData.guestName = guestName
      }

      const updated = await tx.bookingPayment.update({
        where: { id: paymentId },
        data: updateData,
        include: {
          user: { select: { name: true } },
          collectedBy: { select: { name: true } },
        },
      })

      // Auto-sync: recalcular Booking.paymentStatus (protege exempt)
      if (status) {
        await sincronizarEstadoPago(tx, bookingId)
      }

      return updated
    })

    logger.info("BOOKING_PAYMENTS", "Pago de jugador actualizado", {
      bookingId,
      paymentId,
      status: updatedPayment.status,
    })

    return NextResponse.json({
      id: updatedPayment.id,
      userId: updatedPayment.userId,
      userName: updatedPayment.user?.name || null,
      guestName: updatedPayment.guestName,
      amount: updatedPayment.amount,
      status: updatedPayment.status,
      paidAt: updatedPayment.paidAt,
      collectedByName: updatedPayment.collectedBy?.name || null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Pago no encontrado." }, { status: 404 })
    }
    logger.error("BOOKING_PAYMENTS", "Error al actualizar pago de jugador", {
      bookingId: params.bookingId,
      paymentId: params.paymentId,
    }, error as Error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
