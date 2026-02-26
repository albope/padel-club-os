import { NextResponse } from "next/server"
import { constructWebhookEvent, getPlanKeyFromPriceId } from "@/lib/stripe"
import { db } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
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
        if (!clubId || session.mode !== "subscription") break

        await db.club.update({
          where: { id: clubId },
          data: {
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: "active",
          },
        })
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
