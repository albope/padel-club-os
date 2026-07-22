import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { stripe, PLAN_PRICES, PlanKey } from "@/lib/stripe"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { validarBody } from "@/lib/validation"
import * as z from "zod"
import { isStripeTaxEnabled } from "@/lib/legal"
import { LEGAL_VERSIONS } from "@/lib/legal-versions"

const CheckoutSchema = z.object({
  planKey: z.enum(["starter", "pro", "enterprise"] as const, {
    errorMap: () => ({ message: "Plan no valido." }),
  }),
  legalAccepted: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar las condiciones del servicio y el acuerdo de tratamiento de datos." }),
  }),
})

const MINIMO_TRIAL_STRIPE_MS = 48 * 60 * 60 * 1000

export async function POST(req: Request) {
  try {
    const auth = await requireAuth("billing:update")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const result = validarBody(CheckoutSchema, body)
    if (!result.success) return result.response
    const { planKey } = result.data

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
        preferred_locales: ["es"],
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

    // El trial se concede una sola vez por club. Si aun no hubo suscripcion,
    // Stripe hereda exactamente el tiempo restante del trial creado al registrar.
    const puedeHeredarTrial = Boolean(
      club.trialEndsAt
      && club.trialEndsAt.getTime() > Date.now() + MINIMO_TRIAL_STRIPE_MS
      && !club.stripeSubscriptionId
      && club.subscriptionStatus !== "canceled"
    )

    // Crear sesion de Checkout
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    // Registrar la version contractual antes de generar un enlace de pago externo.
    await db.legalAcceptance.create({
      data: {
        audience: "CLUB",
        termsVersion: LEGAL_VERSIONS.terminos,
        dpaVersion: LEGAL_VERSIONS.dpa,
        privacyVersion: LEGAL_VERSIONS.privacidad,
        acceptedByEmail: auth.session.user.email || "email-no-disponible",
        acceptedByName: auth.session.user.name || null,
        clubName: club.name,
        userId: auth.session.user.id,
        clubId: club.id,
      },
    })

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: plan.monthly, quantity: 1 }],
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      tax_id_collection: { enabled: true, required: "if_supported" },
      automatic_tax: { enabled: isStripeTaxEnabled() },
      success_url: `${baseUrl}/dashboard/facturacion?success=true`,
      cancel_url: `${baseUrl}/dashboard/facturacion?cancelled=true`,
      subscription_data: {
        metadata: { clubId: club.id, planKey },
        ...(puedeHeredarTrial && club.trialEndsAt
          ? { trial_end: Math.floor(club.trialEndsAt.getTime() / 1000) }
          : {}),
      },
      metadata: { clubId: club.id, planKey },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error("STRIPE_CHECKOUT", "Error al crear sesion de pago", { ruta: "/api/stripe/checkout" }, error)
    return NextResponse.json(
      { error: "Error al crear sesion de pago" },
      { status: 500 }
    )
  }
}
