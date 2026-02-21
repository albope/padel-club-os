import Stripe from "stripe"

// Cliente Stripe singleton (server-side)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
})

// Planes de suscripcion SaaS
export const PLAN_PRICES = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    name: "Starter",
    price: 19,
    limits: {
      courts: 4,
      members: 50,
      admins: 1,
    },
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    name: "Pro",
    price: 49,
    limits: {
      courts: -1, // ilimitado
      members: 500,
      admins: 3,
    },
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
    name: "Enterprise",
    price: 99,
    limits: {
      courts: -1,
      members: -1,
      admins: -1,
    },
  },
} as const

export type PlanKey = keyof typeof PLAN_PRICES

/** Verifica la firma del webhook de Stripe */
export function constructWebhookEvent(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, secret)
}

/** Obtiene el PlanKey a partir de un price ID de Stripe */
export function getPlanKeyFromPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLAN_PRICES)) {
    if (plan.monthly === priceId) return key as PlanKey
  }
  return null
}
