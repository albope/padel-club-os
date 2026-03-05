import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST() {
  try {
    const auth = await requireAuth("billing:read")
    if (isAuthError(auth)) return auth

    const club = await db.club.findUnique({
      where: { id: auth.session.user.clubId },
    })

    if (!club?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No hay cuenta de facturacion configurada" },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const session = await stripe.billingPortal.sessions.create({
      customer: club.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/facturacion`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error("STRIPE_PORTAL", "Error al abrir portal de facturacion", { ruta: "/api/stripe/portal" }, error)
    return NextResponse.json(
      { error: "Error al abrir portal de facturacion" },
      { status: 500 }
    )
  }
}
