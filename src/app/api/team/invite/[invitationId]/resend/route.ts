import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { generarTokenAleatorio, hashToken } from "@/lib/tokens"
import { enviarEmailInvitacionEquipo } from "@/lib/email"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const limiter = crearRateLimiter({ maxRequests: 10, windowMs: 60 * 60 * 1000, prefix: "rl:team-invite" })

const INVITATION_EXPIRY_MS = 48 * 60 * 60 * 1000

// POST: Reenviar invitacion con token nuevo
export async function POST(
  req: Request,
  { params }: { params: { invitationId: string } }
) {
  try {
    const auth = await requireAuth("team:invite")
    if (isAuthError(auth)) return auth

    const ip = obtenerIP(req)
    if (!(await limiter.verificar(ip))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentalo de nuevo mas tarde." },
        { status: 429 }
      )
    }

    const { invitationId } = params
    if (!invitationId) {
      return NextResponse.json({ error: "ID de invitacion requerido." }, { status: 400 })
    }

    const clubId = auth.session.user.clubId

    // Buscar invitacion existente
    const oldInvitation = await db.adminInvitation.findFirst({
      where: { id: invitationId, clubId },
    })

    if (!oldInvitation) {
      return NextResponse.json({ error: "Invitacion no encontrada." }, { status: 404 })
    }

    // Borrar la vieja y crear nueva con token fresco
    const tokenPlano = generarTokenAleatorio()
    const tokenHash = hashToken(tokenPlano)
    const expires = new Date(Date.now() + INVITATION_EXPIRY_MS)

    await db.adminInvitation.delete({ where: { id: invitationId } })

    const newInvitation = await db.adminInvitation.create({
      data: {
        email: oldInvitation.email,
        role: oldInvitation.role,
        token: tokenHash,
        expires,
        invitedById: auth.session.user.id,
        clubId,
      },
    })

    // Obtener nombre del club
    const club = await db.club.findUnique({
      where: { id: clubId },
      select: { name: true },
    })

    const rolLabel = oldInvitation.role === "CLUB_ADMIN" ? "Administrador" : "Staff"

    // Enviar email fire-and-forget
    enviarEmailInvitacionEquipo({
      email: oldInvitation.email,
      invitadorNombre: auth.session.user.name || "Un administrador",
      clubNombre: club?.name || "Tu club",
      rol: rolLabel,
      token: tokenPlano,
    }).catch(() => {})

    return NextResponse.json({
      id: newInvitation.id,
      email: newInvitation.email,
      role: newInvitation.role,
    })
  } catch (error) {
    logger.error("TEAM_RESEND", "Error al reenviar invitacion", { ruta: "/api/team/invite/[invitationId]/resend" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
