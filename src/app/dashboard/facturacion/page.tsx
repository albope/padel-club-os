import React from "react"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import BillingOverview from "@/components/facturacion/BillingOverview"
import PricingPlans from "@/components/facturacion/PricingPlans"

const FacturacionPage = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.clubId) {
    redirect("/login")
  }

  const club = await db.club.findUnique({
    where: { id: session.user.clubId },
  })

  if (!club) {
    return <div>Club no encontrado.</div>
  }

  const payments = await db.payment.findMany({
    where: {
      clubId: session.user.clubId,
      type: "subscription",
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Facturacion</h1>
        <p className="mt-1 text-muted-foreground">
          Gestiona tu plan de suscripcion y revisa tu historial de pagos.
        </p>
      </div>

      <BillingOverview
        subscriptionTier={club.subscriptionTier}
        subscriptionStatus={club.subscriptionStatus}
        trialEndsAt={club.trialEndsAt?.toISOString() ?? null}
        hasStripeCustomer={!!club.stripeCustomerId}
        payments={payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        }))}
      />

      <PricingPlans currentTier={club.subscriptionTier} />
    </div>
  )
}

export default FacturacionPage
