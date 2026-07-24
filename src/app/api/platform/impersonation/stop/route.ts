import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  emitirSesionJwt,
  establecerCookieSesion,
  origenPermitido,
} from "@/lib/session-cookie"
import { registrarAuditoria } from "@/lib/audit"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    if (!origenPermitido(req)) {
      return NextResponse.json({ error: "Origen no permitido." }, { status: 403 })
    }
    const session = await getServerSession(authOptions)
    if (
      !session?.user?.actorId
      || !session.user.impersonationId
      || session.user.authInvalid
    ) {
      return NextResponse.json({ error: "No hay una impersonacion activa." }, { status: 409 })
    }

    const impersonation = await db.impersonationSession.findFirst({
      where: {
        id: session.user.impersonationId,
        actorId: session.user.actorId,
        endedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            clubId: true,
            isActive: true,
            sessionVersion: true,
            club: { select: { name: true } },
            memberships: {
              where: { status: "ACTIVE" },
              include: { club: { select: { name: true } } },
              orderBy: { joinedAt: "asc" },
              take: 1,
            },
          },
        },
      },
    })
    if (!impersonation?.actor.isActive || impersonation.actor.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "La sesion de soporte ya no es valida." }, { status: 401 })
    }

    await db.impersonationSession.update({
      where: { id: impersonation.id },
      data: { endedAt: new Date() },
    })
    const actor = impersonation.actor
    const membership = actor.memberships[0]
    const clubId = actor.clubId || membership?.clubId || null
    const clubName = actor.club?.name || membership?.club.name || null
    const token = await emitirSesionJwt({
      sub: actor.id,
      id: actor.id,
      name: actor.name,
      email: actor.email,
      picture: actor.image,
      role: actor.role,
      clubId,
      clubName,
      sessionVersion: actor.sessionVersion,
      identityRefreshedAt: Date.now(),
    })
    const response = NextResponse.json({ success: true, redirectUrl: "/dashboard/accesos" })
    establecerCookieSesion(response, token)

    registrarAuditoria({
      recurso: "impersonation",
      accion: "actualizar",
      entidadId: impersonation.id,
      detalles: { ended: true },
      userId: actor.id,
      userName: actor.name,
      clubId: impersonation.clubId,
    })
    return response
  } catch (error) {
    logger.error("IMPERSONATION_STOP", "Error finalizando impersonacion", {}, error)
    return NextResponse.json({ error: "No se pudo recuperar la sesion de soporte." }, { status: 500 })
  }
}
