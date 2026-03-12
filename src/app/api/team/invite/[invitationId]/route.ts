import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

// DELETE: Revocar invitacion
export async function DELETE(
  req: Request,
  { params }: { params: { invitationId: string } }
) {
  try {
    const auth = await requireAuth("team:invite")
    if (isAuthError(auth)) return auth

    const { invitationId } = params
    if (!invitationId) {
      return NextResponse.json({ error: "ID de invitacion requerido." }, { status: 400 })
    }

    const clubId = auth.session.user.clubId

    // Verificar que la invitacion existe y pertenece al club
    const invitation = await db.adminInvitation.findFirst({
      where: { id: invitationId, clubId },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitacion no encontrada." }, { status: 404 })
    }

    // Borrar (revocar)
    await db.adminInvitation.delete({ where: { id: invitationId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error("TEAM_REVOKE", "Error al revocar invitacion", { ruta: "/api/team/invite/[invitationId]" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
