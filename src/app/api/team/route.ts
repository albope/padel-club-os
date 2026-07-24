import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { canCreateAdmin } from "@/lib/subscription"
import { logger } from "@/lib/logger"

// GET: Listar miembros del equipo + invitaciones pendientes
export async function GET() {
  try {
    const auth = await requireAuth("team:read")
    if (isAuthError(auth)) return auth

    const clubId = auth.session.user.clubId

    const [members, invitations, limits] = await Promise.all([
      db.clubMembership.findMany({
        where: {
          clubId,
          role: { in: ["CLUB_ADMIN", "STAFF"] },
          status: { not: "REVOKED" },
        },
        select: {
          id: true,
          role: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { user: { name: "asc" } },
      }),
      db.adminInvitation.findMany({
        where: { clubId, expires: { gt: new Date() } },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          expires: true,
          invitedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      canCreateAdmin(clubId),
    ])

    return NextResponse.json({
      members: members.map((membership) => ({
        id: membership.user.id,
        membershipId: membership.id,
        name: membership.user.name,
        email: membership.user.email,
        role: membership.role,
        isActive: membership.status === "ACTIVE",
      })),
      invitations,
      limits: { used: limits.used, limit: limits.limit },
      currentUserId: auth.session.user.id,
    })
  } catch (error) {
    logger.error("TEAM_LIST", "Error al listar equipo", { ruta: "/api/team" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
