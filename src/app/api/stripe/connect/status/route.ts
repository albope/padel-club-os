import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { logger } from "@/lib/logger"

// GET: Consultar estado de Stripe Connect del club
export async function GET() {
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

    if (!club?.stripeConnectAccountId) {
      return NextResponse.json({
        accountId: null,
        onboarded: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      })
    }

    const account = await stripe.accounts.retrieve(club.stripeConnectAccountId)

    // Actualizar estado de onboarding si cambio en Stripe
    if (account.charges_enabled && account.details_submitted && !club.stripeConnectOnboarded) {
      await db.club.update({
        where: { id: auth.session.user.clubId },
        data: { stripeConnectOnboarded: true },
      })
    }

    return NextResponse.json({
      accountId: club.stripeConnectAccountId,
      onboarded: account.charges_enabled && account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    })
  } catch (error) {
    logger.error("STRIPE_CONNECT_STATUS", "Error consultando estado de Connect", { ruta: "/api/stripe/connect/status" }, error)
    return NextResponse.json(
      { error: "Error al consultar el estado de Stripe Connect." },
      { status: 500 }
    )
  }
}
