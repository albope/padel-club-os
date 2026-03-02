import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { logger } from "@/lib/logger"

// POST: Generar link de acceso al dashboard Express de Stripe
export async function POST() {
  try {
    const auth = await requireAuth("billing:read")
    if (isAuthError(auth)) return auth

    const club = await db.club.findUnique({
      where: { id: auth.session.user.clubId },
      select: {
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
      },
    })

    if (!club?.stripeConnectAccountId || !club.stripeConnectOnboarded) {
      return NextResponse.json(
        { error: "La cuenta de Stripe Connect no esta configurada." },
        { status: 400 }
      )
    }

    const loginLink = await stripe.accounts.createLoginLink(club.stripeConnectAccountId)

    return NextResponse.json({ url: loginLink.url })
  } catch (error) {
    logger.error("STRIPE_CONNECT_DASHBOARD", "Error generando link de dashboard", { ruta: "/api/stripe/connect/dashboard" }, error)
    return NextResponse.json(
      { error: "Error al generar el enlace del dashboard de Stripe." },
      { status: 500 }
    )
  }
}
