import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const TAG = "PLATFORM_CLUBS"

export async function GET() {
  try {
    const auth = await requireAuth("platform:read")
    if (isAuthError(auth)) return auth

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
            memberships: { where: { role: "PLAYER", status: "ACTIVE" } },
            bookings: { where: { startTime: { gte: hace30dias } } },
          },
        },
      },
    })

    return NextResponse.json({
      clubs: clubs.map((club) => ({
        ...club,
        _count: {
          courts: club._count.courts,
          members: club._count.memberships,
          bookings: club._count.bookings,
        },
      })),
    })
  } catch (error) {
    logger.error(TAG, "Error al listar clubes", {}, error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
