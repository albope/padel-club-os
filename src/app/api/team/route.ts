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
      db.user.findMany({
        where: { clubId, role: { not: "PLAYER" } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
        orderBy: { name: "asc" },
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
      members,
      invitations,
      limits: { used: limits.used, limit: limits.limit },
      currentUserId: auth.session.user.id,
    })
  } catch (error) {
    logger.error("TEAM_LIST", "Error al listar equipo", { ruta: "/api/team" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
