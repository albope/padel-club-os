import { NextResponse } from "next/server"
import { stripe, constructWebhookEvent, getPlanKeyFromPriceId } from "@/lib/stripe"
import { db } from "@/lib/db"
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
    console.error("[STRIPE_WEBHOOK_SIGNATURE_ERROR]", err)
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
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_HANDLER_ERROR]", error)
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    )
  }
}
