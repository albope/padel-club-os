import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import ClubsClient from "@/components/platform/ClubsClient"

export default async function ClubsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || !hasPermission(session.user.role, "platform:read")) {
    redirect("/dashboard")
  }

  const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const clubs = await db.club.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      esDemo: true,
      stripeSubscriptionId: true,
      _count: {
        select: {
          courts: true,
          admins: { where: { role: "PLAYER" } },
          bookings: { where: { startTime: { gte: hace30dias } } },
        },
      },
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clubes</h1>
        <p className="text-muted-foreground">
          Todos los clubes de la plataforma: suscripciones, trials y generador de demos.
        </p>
      </div>

      <ClubsClient initialClubs={JSON.parse(JSON.stringify(clubs))} />
    </div>
  )
}
