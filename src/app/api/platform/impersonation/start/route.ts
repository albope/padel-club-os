import { db } from "@/lib/db"
import { isAuthError, requireAuth } from "@/lib/api-auth"
import { generarTokenAleatorio, hashToken } from "@/lib/tokens"
import {
  emitirSesionJwt,
  establecerCookieSesion,
  origenPermitido,
} from "@/lib/session-cookie"
import { registrarAuditoria } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import * as z from "zod"

const SESSION_SECONDS = 30 * 60
const Schema = z.object({
  userId: z.string().min(1),
  clubId: z.string().min(1),
  reason: z.string().trim().min(10).max(300),
})

export async function POST(req: Request) {
  try {
    if (!origenPermitido(req)) {
      return NextResponse.json({ error: "Origen no permitido." }, { status: 403 })
    }
    const auth = await requireAuth("platform:manage")
    if (isAuthError(auth)) return auth
    if (auth.session.user.actorId) {
      return NextResponse.json(
        { error: "Finaliza la impersonacion actual antes de iniciar otra." },
        { status: 409 },
      )
    }

    const parsed = Schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Datos no validos." },
        { status: 400 },
      )
    }

    const membership = await db.clubMembership.findUnique({
      where: {
        userId_clubId: {
          userId: parsed.data.userId,
          clubId: parsed.data.clubId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isActive: true,
            sessionVersion: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })
    if (!membership || membership.status !== "ACTIVE" || !membership.user.isActive) {
      return NextResponse.json(
        { error: "El usuario no tiene acceso activo a ese club." },
        { status: 404 },
      )
    }
    if (membership.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No se permite impersonar a otro super administrador." },
        { status: 403 },
      )
    }

    const supportToken = generarTokenAleatorio()
    const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000)
    const impersonation = await db.impersonationSession.create({
      data: {
        tokenHash: hashToken(supportToken),
        actorId: auth.session.user.id,
        subjectId: membership.user.id,
        clubId: membership.club.id,
        reason: parsed.data.reason,
        readOnly: true,
        expiresAt,
      },
    })

    const sessionToken = await emitirSesionJwt({
      sub: membership.user.id,
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      picture: membership.user.image,
      clubId: membership.club.id,
      clubName: membership.club.name,
      role: membership.role,
      sessionVersion: membership.user.sessionVersion,
      identityRefreshedAt: Date.now(),
      actorId: auth.session.user.id,
      actorName: auth.session.user.name || auth.session.user.email || "Soporte",
      impersonationId: impersonation.id,
      impersonationToken: supportToken,
      impersonationReadOnly: true,
    }, SESSION_SECONDS)

    const redirectUrl = membership.role === "PLAYER"
      ? `/club/${membership.club.slug}`
      : "/dashboard"
    const response = NextResponse.json({
      success: true,
      redirectUrl,
      expiresAt,
      readOnly: true,
    })
    establecerCookieSesion(response, sessionToken, SESSION_SECONDS)

    registrarAuditoria({
      recurso: "impersonation",
      accion: "crear",
      entidadId: impersonation.id,
      detalles: {
        subjectId: membership.user.id,
        role: membership.role,
        readOnly: true,
        reason: parsed.data.reason,
      },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: membership.club.id,
    })
    return response
  } catch (error) {
    logger.error("IMPERSONATION_START", "Error iniciando impersonacion", {}, error)
    return NextResponse.json({ error: "No se pudo iniciar el acceso delegado." }, { status: 500 })
  }
}
