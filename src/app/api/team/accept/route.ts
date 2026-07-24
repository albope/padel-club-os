import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { hashToken } from "@/lib/tokens"
import { canCreateAdmin } from "@/lib/subscription"
import { enviarEmailBienvenidaEquipo } from "@/lib/email"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { validarBody } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { hash } from "bcrypt"
import { normalizarEmail } from "@/lib/identity"
import * as z from "zod"

const limiter = crearRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000, prefix: "rl:team-accept" })

const AcceptSchema = z.object({
  token: z.string().min(1, "Token requerido."),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres.").max(128).optional(),
})

/**
 * Busca una invitacion valida (no expirada) por hash del token.
 */
async function buscarInvitacionValida(tokenPlano: string) {
  const tokenHash = hashToken(tokenPlano)
  return db.adminInvitation.findUnique({
    where: { token: tokenHash },
    include: {
      club: { select: { name: true } },
    },
  })
}

/**
 * Determina si un usuario existente necesita configurar password.
 */
function necesitaPassword(user: { password: string | null; mustResetPassword: boolean }): boolean {
  return !user.password || user.mustResetPassword
}

// GET: Validar token y obtener info de la invitacion
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tokenPlano = searchParams.get("token")

    if (!tokenPlano) {
      return NextResponse.json({ valid: false })
    }

    const invitation = await buscarInvitacionValida(tokenPlano)

    if (!invitation || invitation.expires < new Date()) {
      return NextResponse.json({ valid: false })
    }

    // Verificar si el usuario ya existe para determinar si necesita password
    const existingUser = await db.user.findFirst({
      where: { email: normalizarEmail(invitation.email) },
      select: { password: true, mustResetPassword: true, name: true },
    })

    const rolLabel = invitation.role === "CLUB_ADMIN" ? "Administrador" : "Staff"

    return NextResponse.json({
      valid: true,
      clubName: invitation.club.name,
      role: rolLabel,
      email: invitation.email,
      requiresPassword: existingUser ? necesitaPassword(existingUser) : true,
      existingName: existingUser?.name || null,
    })
  } catch (error) {
    logger.error("TEAM_ACCEPT_VALIDATE", "Error al validar token", { ruta: "/api/team/accept" }, error)
    return NextResponse.json({ valid: false })
  }
}

// POST: Aceptar invitacion
export async function POST(req: Request) {
  try {
    const ip = obtenerIP(req)
    if (!(await limiter.verificar(ip))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentalo de nuevo mas tarde." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const result = validarBody(AcceptSchema, body)
    if (!result.success) return result.response

    const { token: tokenPlano, name, password } = result.data

    // Buscar invitacion valida
    const invitation = await buscarInvitacionValida(tokenPlano)

    if (!invitation || invitation.expires < new Date()) {
      return NextResponse.json(
        { error: "La invitacion no es valida o ha expirado." },
        { status: 400 }
      )
    }

    const clubId = invitation.clubId

    // Re-verificar limite del plan (excluir esta invitacion del conteo)
    const check = await canCreateAdmin(clubId, { excludeInvitationId: invitation.id })
    if (!check.allowed) {
      return NextResponse.json(
        { error: "El club ha alcanzado el limite de administradores de su plan." },
        { status: 403 }
      )
    }

    // Buscar si el email ya existe
    const existingUser = await db.user.findUnique({
      where: { email: normalizarEmail(invitation.email) },
      select: {
        id: true,
        clubId: true,
        password: true,
        mustResetPassword: true,
        name: true,
        memberships: {
          where: { clubId },
          select: { id: true },
        },
      },
    })

    // La identidad es global: una misma cuenta puede aceptar roles en varios
    // clubes sin duplicar credenciales.
    if (existingUser && !necesitaPassword(existingUser)) {
      // Solo upgrade de rol, NO tocar password
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            ...(existingUser.clubId === clubId || !existingUser.clubId
              ? { role: invitation.role, clubId }
              : {}),
            emailVerified: new Date(),
            name: name || existingUser.name,
            isActive: true,
            sessionVersion: { increment: 1 },
          },
        })
        await tx.clubMembership.upsert({
          where: { userId_clubId: { userId: existingUser.id, clubId } },
          update: {
            role: invitation.role,
            status: "ACTIVE",
            approvedAt: new Date(),
            approvedById: invitation.invitedById,
          },
          create: {
            userId: existingUser.id,
            clubId,
            role: invitation.role,
            status: "ACTIVE",
            approvedAt: new Date(),
            approvedById: invitation.invitedById,
          },
        })
        await tx.adminInvitation.delete({ where: { id: invitation.id } })
      })

      const rolLabel = invitation.role === "CLUB_ADMIN" ? "Administrador" : "Staff"
      await enviarEmailBienvenidaEquipo({
        email: invitation.email,
        nombre: name || existingUser.name || "",
        clubNombre: invitation.club.name,
        rol: rolLabel,
      }).catch(() => {})

      return NextResponse.json({
        success: true,
        requiresPassword: false,
        redirectUrl: "/login",
      })
    }

    // Cuenta existente importada o todavia sin credenciales activas.
    if (existingUser && necesitaPassword(existingUser)) {
      if (!password) {
        return NextResponse.json(
          { error: "Se requiere una contrasena para activar la cuenta." },
          { status: 400 }
        )
      }

      const hashedPassword = await hash(password, 10)

      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            ...(existingUser.clubId === clubId || !existingUser.clubId
              ? { role: invitation.role, clubId }
              : {}),
            password: hashedPassword,
            mustResetPassword: false,
            emailVerified: new Date(),
            name: name || existingUser.name,
            isActive: true,
            sessionVersion: { increment: 1 },
          },
        })
        await tx.clubMembership.upsert({
          where: { userId_clubId: { userId: existingUser.id, clubId } },
          update: {
            role: invitation.role,
            status: "ACTIVE",
            approvedAt: new Date(),
            approvedById: invitation.invitedById,
          },
          create: {
            userId: existingUser.id,
            clubId,
            role: invitation.role,
            status: "ACTIVE",
            approvedAt: new Date(),
            approvedById: invitation.invitedById,
          },
        })
        await tx.adminInvitation.delete({ where: { id: invitation.id } })
      })

      const rolLabel = invitation.role === "CLUB_ADMIN" ? "Administrador" : "Staff"
      await enviarEmailBienvenidaEquipo({
        email: invitation.email,
        nombre: name || existingUser.name || "",
        clubNombre: invitation.club.name,
        rol: rolLabel,
      }).catch(() => {})

      return NextResponse.json({
        success: true,
        requiresPassword: true,
        redirectUrl: "/login",
      })
    }

    // Caso D: no existe — crear usuario nuevo
    if (!password) {
      return NextResponse.json(
        { error: "Se requiere una contrasena para crear la cuenta." },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 10)

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizarEmail(invitation.email),
          name,
          password: hashedPassword,
          role: invitation.role,
          clubId,
          isActive: true,
          mustResetPassword: false,
          emailVerified: new Date(),
        },
      })
      await tx.clubMembership.create({
        data: {
          userId: user.id,
          clubId,
          role: invitation.role,
          status: "ACTIVE",
          approvedAt: new Date(),
          approvedById: invitation.invitedById,
        },
      })
      await tx.adminInvitation.delete({ where: { id: invitation.id } })
    })

    const rolLabel = invitation.role === "CLUB_ADMIN" ? "Administrador" : "Staff"
    await enviarEmailBienvenidaEquipo({
      email: invitation.email,
      nombre: name,
      clubNombre: invitation.club.name,
      rol: rolLabel,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      requiresPassword: true,
      redirectUrl: "/login",
    }, { status: 201 })
  } catch (error) {
    logger.error("TEAM_ACCEPT", "Error al aceptar invitacion", { ruta: "/api/team/accept" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
