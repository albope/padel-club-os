import { NextResponse } from "next/server"
import { constructWebhookEvent, getPlanKeyFromPriceId } from "@/lib/stripe"
import { db } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import { enviarEmailConfirmacionReserva } from "@/lib/email"
import { logger } from "@/lib/logger"
import type Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Falta firma de Stripe" },
      { status: 400 }
    )
  }

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    logger.error("STRIPE_WEBHOOK_SIGNATURE", "Firma de webhook invalida", { ruta: "/api/stripe/webhook" }, err)
    return NextResponse.json(
      { error: "Firma invalida" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const clubId = session.metadata?.clubId

        // Pago de suscripcion SaaS
        if (session.mode === "subscription" && clubId) {
          await db.club.update({
            where: { id: clubId },
            data: {
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: "active",
            },
          })
        }

        // Pago de reserva via Stripe Connect
        if (session.mode === "payment" && session.metadata?.type === "booking_payment") {
          const bookingId = session.metadata.bookingId
          const paymentClubId = session.metadata.clubId
          const userId = session.metadata.userId

          if (!bookingId || !paymentClubId) break

          // Idempotencia: verificar que no existe ya un pago para esta reserva
          const existingPayment = await db.payment.findUnique({
            where: { bookingId },
          })
          if (existingPayment) break

          // Actualizar reserva y crear registro de pago en transaccion
          const [updatedBooking] = await db.$transaction([
            db.booking.update({
              where: { id: bookingId },
              data: { paymentStatus: "paid" },
              include: {
                court: { select: { name: true } },
                user: { select: { email: true, name: true, club: { select: { name: true, slug: true } } } },
              },
            }),
            db.payment.create({
              data: {
                amount: (session.amount_total ?? 0) / 100,
                currency: session.currency?.toUpperCase() ?? "EUR",
                status: "succeeded",
                type: "booking",
                stripePaymentId: session.payment_intent as string,
                bookingId,
                userId,
                clubId: paymentClubId,
              },
            }),
          ])

          logger.info("STRIPE_BOOKING_PAYMENT", "Pago de reserva confirmado", { bookingId, amount: (session.amount_total ?? 0) / 100 })

          // Notificacion y email de confirmacion (fire-and-forget)
          if (userId) {
            crearNotificacion({
              tipo: "booking_confirmed",
              titulo: "Pago confirmado",
              mensaje: `Tu pago para la reserva en ${updatedBooking.court.name} ha sido confirmado.`,
              userId,
              clubId: paymentClubId,
              metadata: { bookingId },
              url: "/reservar",
            }).catch(() => {})
          }

          if (updatedBooking.user?.email) {
            enviarEmailConfirmacionReserva({
              email: updatedBooking.user.email,
              nombre: updatedBooking.user.name || "Jugador",
              pistaNombre: updatedBooking.court.name,
              fechaHoraInicio: updatedBooking.startTime,
              fechaHoraFin: updatedBooking.endTime,
              precioTotal: updatedBooking.totalPrice,
              estadoPago: "paid",
              clubNombre: updatedBooking.user.club?.name || "",
              clubSlug: updatedBooking.user.club?.slug || "",
            }).catch(() => {})
          }
        }

        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const clubId = subscription.metadata?.clubId

        if (!clubId) {
          // Buscar club por stripeSubscriptionId
          const club = await db.club.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          })
          if (!club) break

          const priceId = subscription.items.data[0]?.price?.id
          const planKey = priceId ? getPlanKeyFromPriceId(priceId) : null

          await db.club.update({
            where: { id: club.id },
            data: {
              subscriptionStatus: subscription.status,
              ...(planKey && { subscriptionTier: planKey }),
            },
          })
          break
        }

        const priceId = subscription.items.data[0]?.price?.id
        const planKey = priceId ? getPlanKeyFromPriceId(priceId) : null

        await db.club.update({
          where: { id: clubId },
          data: {
            subscriptionStatus: subscription.status,
            ...(planKey && { subscriptionTier: planKey }),
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const club = await db.club.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        })
        if (!club) break

        await db.club.update({
          where: { id: club.id },
          data: {
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
          },
        })
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const club = await db.club.findFirst({
          where: { stripeCustomerId: customerId },
        })
        if (!club) break

        // Crear registro de pago
        await db.payment.create({
          data: {
            amount: (invoice.amount_paid ?? 0) / 100, // Stripe usa centimos
            currency: invoice.currency?.toUpperCase() ?? "EUR",
            status: "succeeded",
            type: "subscription",
            stripePaymentId: invoice.id,
            clubId: club.id,
          },
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const club = await db.club.findFirst({
          where: { stripeCustomerId: customerId },
        })
        if (!club) break

        await db.club.update({
          where: { id: club.id },
          data: { subscriptionStatus: "past_due" },
        })
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string
        if (!paymentIntentId) break

        const payment = await db.payment.findFirst({
          where: { stripePaymentId: paymentIntentId, type: "booking" },
        })
        if (!payment || payment.status === "refunded") break

        await db.payment.update({
          where: { id: payment.id },
          data: { status: "refunded" },
        })

        logger.info("STRIPE_REFUND", "Reembolso de reserva procesado", { paymentId: payment.id, bookingId: payment.bookingId })
        break
      }

      case "customer.subscription.trial_will_end": {
        // Stripe envia este evento 3 dias antes de que expire el trial
        const subscription = event.data.object as Stripe.Subscription
        const club = await db.club.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        })
        if (!club) break

        // Notificar a todos los admins del club
        const admins = await db.user.findMany({
          where: {
            clubId: club.id,
            role: { in: ["SUPER_ADMIN", "CLUB_ADMIN"] },
          },
          select: { id: true },
        })

        for (const admin of admins) {
          await crearNotificacion({
            tipo: "subscription_trial_ending",
            titulo: "Tu prueba gratuita termina pronto",
            mensaje: "Quedan 3 dias de prueba gratuita. Elige un plan para seguir usando Padel Club OS sin interrupciones.",
            userId: admin.id,
            clubId: club.id,
            url: "/dashboard/facturacion",
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error("STRIPE_WEBHOOK_HANDLER", "Error procesando evento webhook", { ruta: "/api/stripe/webhook" }, error)
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    )
  }
}
