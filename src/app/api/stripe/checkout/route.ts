import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { stripe, PLAN_PRICES, PlanKey } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const auth = await requireAuth("billing:update")
    if (isAuthError(auth)) return auth

    const { planKey } = (await req.json()) as { planKey: string }

    // Validar plan
    if (!planKey || !(planKey in PLAN_PRICES)) {
      return NextResponse.json(
        { error: "Plan no valido" },
        { status: 400 }
      )
    }

    const plan = PLAN_PRICES[planKey as PlanKey]

    const club = await db.club.findUnique({
      where: { id: auth.session.user.clubId },
    })

    if (!club) {
      return NextResponse.json(
        { error: "Club no encontrado" },
        { status: 404 }
      )
    }

    // Crear o recuperar customer de Stripe
    let customerId = club.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.session.user.email ?? undefined,
        name: club.name,
        metadata: {
          clubId: club.id,
          clubName: club.name,
        },
      })
      customerId = customer.id
      await db.club.update({
        where: { id: club.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Crear sesion de Checkout
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: plan.monthly, quantity: 1 }],
      success_url: `${baseUrl}/dashboard/facturacion?success=true`,
      cancel_url: `${baseUrl}/dashboard/facturacion?cancelled=true`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { clubId: club.id },
      },
      metadata: { clubId: club.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[STRIPE_CHECKOUT_ERROR]", error)
    return NextResponse.json(
      { error: "Error al crear sesion de pago" },
      { status: 500 }
    )
  }
}
