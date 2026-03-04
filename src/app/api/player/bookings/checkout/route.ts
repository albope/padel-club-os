import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { stripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe"
import { validarBody } from "@/lib/validation"
import { logger } from "@/lib/logger"
import * as z from "zod"

const CheckoutSchema = z.object({
  bookingId: z.string().min(1, "El ID de reserva es requerido."),
})

// POST: Crear Checkout Session para pagar una reserva (idempotente)
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("bookings:create")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const result = validarBody(CheckoutSchema, body)
    if (!result.success) return result.response
    const { bookingId } = result.data

    // Verificar que la reserva pertenece al jugador, es online y esta pendiente
    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        userId: auth.session.user.id,
        clubId: auth.session.user.clubId,
        status: "confirmed",
        paymentStatus: "pending",
        paymentMethod: "online",
      },
      include: {
        court: { select: { name: true } },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada o no requiere pago." },
        { status: 404 }
      )
    }

    // Verificar que no existe ya un pago completado
    const existingPayment = await db.payment.findUnique({
      where: { bookingId },
    })
    if (existingPayment) {
      return NextResponse.json(
        { error: "Esta reserva ya tiene un pago asociado." },
        { status: 400 }
      )
    }

    const now = new Date()

    // Idempotencia: si ya hay una Checkout Session activa, reutilizarla
    if (booking.checkoutSessionId && booking.checkoutSessionExpiresAt && booking.checkoutSessionExpiresAt > now) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(booking.checkoutSessionId)
        if (existingSession.status === "open" && existingSession.url) {
          return NextResponse.json({ url: existingSession.url })
        }
      } catch {
        // Session no encontrada o expirada, continuar a crear una nueva
      }
    }

    // Reclamar lock con updateMany atomico para evitar sesiones duplicadas
    const lockExpiry = new Date(now.getTime() + 30 * 1000) // 30 segundos
    const { count: lockAcquired } = await db.booking.updateMany({
      where: {
        id: bookingId,
        status: "confirmed",
        paymentStatus: "pending",
        OR: [
          { checkoutLockUntil: null },
          { checkoutLockUntil: { lt: now } },
        ],
      },
      data: { checkoutLockUntil: lockExpiry },
    })

    if (lockAcquired === 0) {
      return NextResponse.json(
        { error: "Hay un proceso de pago en curso. Intenta de nuevo en unos segundos." },
        { status: 409 }
      )
    }

    // Expirar session previa si existia
    if (booking.checkoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(booking.checkoutSessionId)
      } catch {
        // Session ya expirada o completada, continuar
      }
    }

    // Verificar que el club tiene Connect configurado
    const club = await db.club.findUnique({
      where: { id: auth.session.user.clubId },
      select: {
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
        slug: true,
        name: true,
      },
    })

    if (!club?.stripeConnectAccountId || !club.stripeConnectOnboarded) {
      // Limpiar lock
      await db.booking.update({ where: { id: bookingId }, data: { checkoutLockUntil: null } }).catch(() => {})
      return NextResponse.json(
        { error: "El club no tiene los pagos online configurados." },
        { status: 400 }
      )
    }

    const totalCentimos = Math.round((booking.totalPrice ?? 0) * 100)
    const applicationFee = Math.round(totalCentimos * PLATFORM_FEE_PERCENT / 100)

    const fechaFormateada = booking.startTime.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    const horaInicio = booking.startTime.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
    const horaFin = booking.endTime.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    let session
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `Reserva ${booking.court.name}`,
                description: `${fechaFormateada} | ${horaInicio} - ${horaFin}`,
              },
              unit_amount: totalCentimos,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFee,
          transfer_data: {
            destination: club.stripeConnectAccountId,
          },
        },
        metadata: {
          bookingId: booking.id,
          clubId: auth.session.user.clubId,
          userId: auth.session.user.id,
          type: "booking_payment",
        },
        success_url: `${baseUrl}/club/${club.slug}/reservar?pago=exito&bookingId=${booking.id}`,
        cancel_url: `${baseUrl}/club/${club.slug}/reservar?pago=cancelado`,
        expires_at: Math.floor(Date.now() / 1000) + 900, // 15 minutos
      })
    } catch (stripeError) {
      // Limpiar lock si Stripe falla
      await db.booking.update({ where: { id: bookingId }, data: { checkoutLockUntil: null } }).catch(() => {})
      throw stripeError
    }

    // Persistir sessionId y limpiar lock
    await db.booking.update({
      where: { id: bookingId },
      data: {
        checkoutSessionId: session.id,
        checkoutSessionExpiresAt: new Date(Date.now() + 900 * 1000), // 15 minutos
        checkoutLockUntil: null,
      },
    })

    logger.info("STRIPE_CHECKOUT", "Checkout Session creada para reserva", {
      bookingId,
      sessionId: session.id,
      amount: totalCentimos,
      fee: applicationFee,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error("STRIPE_CHECKOUT", "Error creando Checkout Session", { ruta: "/api/player/bookings/checkout" }, error)
    return NextResponse.json(
      { error: "Error al iniciar el proceso de pago." },
      { status: 500 }
    )
  }
}
