import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { validarBody } from "@/lib/validation"
import { canCreateAdmin } from "@/lib/subscription"
import { generarTokenAleatorio, hashToken } from "@/lib/tokens"
import { enviarEmailInvitacionEquipo } from "@/lib/email"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { registrarAuditoria } from "@/lib/audit"
import { logger } from "@/lib/logger"
import * as z from "zod"

const InviteSchema = z.object({
  email: z.string().email("Email no valido.").max(255).transform((e) => e.toLowerCase().trim()),
  role: z.enum(["CLUB_ADMIN", "STAFF"], { errorMap: () => ({ message: "Rol no valido." }) }),
})

const limiter = crearRateLimiter({ maxRequests: 10, windowMs: 60 * 60 * 1000, prefix: "rl:team-invite" })

const INVITATION_EXPIRY_MS = 48 * 60 * 60 * 1000 // 48 horas

// POST: Enviar invitacion
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("team:invite", { requireSubscription: true })
    if (isAuthError(auth)) return auth

    const ip = obtenerIP(req)
    if (!(await limiter.verificar(ip))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentalo de nuevo mas tarde." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const result = validarBody(InviteSchema, body)
    if (!result.success) return result.response

    const { email, role } = result.data
    const clubId = auth.session.user.clubId

    // Verificar limite del plan
    const check = await canCreateAdmin(clubId)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 })
    }

    // Verificar que el email no es ya admin/staff en este club
    const existingAdmin = await db.user.findFirst({
      where: { email, clubId, role: { not: "PLAYER" } },
      select: { id: true },
    })
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Este email ya pertenece a un miembro del equipo." },
        { status: 409 }
      )
    }

    // Verificar que el email no existe en otro club
    const existingOtherClub = await db.user.findFirst({
      where: { email, clubId: { not: clubId } },
      select: { id: true },
    })
    if (existingOtherClub) {
      return NextResponse.json(
        { error: "Este email ya esta registrado en otro club." },
        { status: 409 }
      )
    }

    // Borrar invitacion previa para este email+club (si existe)
    await db.adminInvitation.deleteMany({
      where: { email, clubId },
    })

    // Generar token
    const tokenPlano = generarTokenAleatorio()
    const tokenHash = hashToken(tokenPlano)
    const expires = new Date(Date.now() + INVITATION_EXPIRY_MS)

    // Crear invitacion
    const invitation = await db.adminInvitation.create({
      data: {
        email,
        role,
        token: tokenHash,
        expires,
        invitedById: auth.session.user.id,
        clubId,
      },
    })

    // Obtener nombre del club para el email
    const club = await db.club.findUnique({
      where: { id: clubId },
      select: { name: true },
    })

    const rolLabel = role === "CLUB_ADMIN" ? "Administrador" : "Staff"

    // Enviar email fire-and-forget
    enviarEmailInvitacionEquipo({
      email,
      invitadorNombre: auth.session.user.name || "Un administrador",
      clubNombre: club?.name || "Tu club",
      rol: rolLabel,
      token: tokenPlano,
    }).catch(() => {})

    registrarAuditoria({
      recurso: "user",
      accion: "crear",
      entidadId: invitation.id,
      detalles: { tipo: "invitacion", email, rol: role },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId,
    })

    return NextResponse.json(
      { id: invitation.id, email, role },
      { status: 201 }
    )
  } catch (error) {
    logger.error("TEAM_INVITE", "Error al enviar invitacion", { ruta: "/api/team/invite" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
