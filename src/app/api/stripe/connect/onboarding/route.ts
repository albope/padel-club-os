import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { canUseOnlinePayments, getSubscriptionInfo } from "@/lib/subscription"
import { logger } from "@/lib/logger"

// POST: Inicia o retoma onboarding de Stripe Connect Express
export async function POST() {
  try {
    const auth = await requireAuth("billing:update")
    if (isAuthError(auth)) return auth

    const clubId = auth.session.user.clubId

    // Verificar que el plan permite pagos online
    const subInfo = await getSubscriptionInfo(clubId)
    if (!canUseOnlinePayments(subInfo.tier)) {
      return NextResponse.json(
        { error: "Los pagos online estan disponibles en los planes Pro y Enterprise." },
        { status: 403 }
      )
    }

    const club = await db.club.findUnique({
      where: { id: clubId },
      select: { stripeConnectAccountId: true, name: true },
    })

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado." }, { status: 404 })
    }

    let accountId = club.stripeConnectAccountId

    // Crear cuenta Express si no existe
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "ES",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: club.name,
        },
        metadata: { clubId },
      })

      accountId = account.id

      await db.club.update({
        where: { id: clubId },
        data: { stripeConnectAccountId: accountId },
      })

      logger.info("STRIPE_CONNECT", "Cuenta Express creada", { clubId, accountId })
    }

    // Generar Account Link para onboarding
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${baseUrl}/dashboard/facturacion?connect=refresh`,
      return_url: `${baseUrl}/dashboard/facturacion?connect=return`,
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    logger.error("STRIPE_CONNECT_ONBOARDING", "Error en onboarding de Connect", { ruta: "/api/stripe/connect/onboarding" }, error)
    return NextResponse.json(
      { error: "Error al iniciar la conexion con Stripe." },
      { status: 500 }
    )
  }
}
