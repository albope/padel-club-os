import { MembershipStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import * as z from "zod"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { registrarAuditoria } from "@/lib/audit"
import { validarBody } from "@/lib/validation"

const MembershipUpdateSchema = z.object({
  status: z.nativeEnum(MembershipStatus),
})

export async function PATCH(req: Request, props: { params: Promise<{ membershipId: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAuth("users:update", { requireSubscription: true })
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const parsed = validarBody(MembershipUpdateSchema, body)
    if (!parsed.success) return parsed.response

    const membership = await db.clubMembership.findFirst({
      where: {
        id: params.membershipId,
        clubId: auth.session.user.clubId,
        role: "PLAYER",
      },
      include: { user: { select: { id: true, clubId: true, name: true } } },
    })

    if (!membership) {
      return NextResponse.json({ error: "Membresia no encontrada" }, { status: 404 })
    }

    if (membership.userId === auth.session.user.id) {
      return NextResponse.json({ error: "No puedes modificar tu propia membresia" }, { status: 403 })
    }

    const updated = await db.$transaction(async (tx) => {
      const updated = await tx.clubMembership.update({
        where: { id: membership.id },
        data: {
          status: parsed.data.status,
          approvedAt: parsed.data.status === MembershipStatus.ACTIVE ? new Date() : null,
          approvedById: parsed.data.status === MembershipStatus.ACTIVE
            ? auth.session.user.id
            : null,
        },
      })

      const membershipsActivas = await tx.clubMembership.findMany({
        where: {
          userId: membership.userId,
          status: MembershipStatus.ACTIVE,
        },
        orderBy: { joinedAt: "asc" },
        select: { clubId: true, role: true },
      })

      const primaria = membershipsActivas.find((item) => item.clubId === membership.user.clubId)
        ?? membershipsActivas[0]

      await tx.user.update({
        where: { id: membership.userId },
        data: {
          isActive: membershipsActivas.length > 0,
          clubId: primaria?.clubId ?? null,
          role: primaria?.role ?? "PLAYER",
          sessionVersion: { increment: 1 },
        },
      })

      return updated
    })

    registrarAuditoria({
      recurso: "user",
      accion: "actualizar",
      entidadId: membership.userId,
      detalles: {
        membershipId: membership.id,
        estadoAnterior: membership.status,
        estadoNuevo: updated.status,
      },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      userId: updated.userId,
    })
  } catch (error) {
    logger.error(
      "MEMBERSHIP_UPDATE",
      "Error actualizando membresia",
      { membershipId: params.membershipId },
      error,
    )
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
