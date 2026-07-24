import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { validarBody } from "@/lib/validation"
import { canCreateAdmin } from "@/lib/subscription"
import { registrarAuditoria } from "@/lib/audit"
import { logger } from "@/lib/logger"
import * as z from "zod"

const ChangeRoleSchema = z.object({
  role: z.enum(["CLUB_ADMIN", "STAFF", "PLAYER"], { errorMap: () => ({ message: "Rol no valido." }) }),
})

// PATCH: Cambiar rol de un miembro del equipo
export async function PATCH(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const { userId } = params
    if (!userId) {
      return NextResponse.json({ error: "ID de usuario requerido." }, { status: 400 })
    }

    const body = await req.json()
    const result = validarBody(ChangeRoleSchema, body)
    if (!result.success) return result.response
    const { role: newRole } = result.data

    // Determinar permiso necesario
    const requiredPermission = newRole === "PLAYER" ? "team:remove" : "team:update"
    const auth = await requireAuth(requiredPermission)
    if (isAuthError(auth)) return auth

    const clubId = auth.session.user.clubId

    // No puede cambiar su propio rol
    if (auth.session.user.id === userId) {
      return NextResponse.json(
        { error: "No puedes cambiar tu propio rol." },
        { status: 403 }
      )
    }

    // Buscar usuario target
    const targetMembership = await db.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      include: {
        user: { select: { id: true, name: true, email: true, clubId: true } },
      },
    })

    if (!targetMembership || targetMembership.status === "REVOKED") {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 })
    }

    // No se puede cambiar el rol de SUPER_ADMIN
    if (targetMembership.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No se puede cambiar el rol de un super administrador." },
        { status: 403 }
      )
    }

    // Si se baja el unico CLUB_ADMIN, bloquear
    if (targetMembership.role === "CLUB_ADMIN" && newRole !== "CLUB_ADMIN") {
      const clubAdminCount = await db.clubMembership.count({
        where: { clubId, role: "CLUB_ADMIN", status: "ACTIVE" },
      })
      if (clubAdminCount <= 1) {
        return NextResponse.json(
          { error: "No puedes dejar al club sin ningun administrador." },
          { status: 403 }
        )
      }
    }

    // Si sube a admin/staff desde PLAYER, verificar limite del plan
    if (targetMembership.role === "PLAYER" && (newRole === "CLUB_ADMIN" || newRole === "STAFF")) {
      const check = await canCreateAdmin(clubId)
      if (!check.allowed) {
        return NextResponse.json({ error: check.reason }, { status: 403 })
      }
    }

    await db.$transaction(async (tx) => {
      await tx.clubMembership.update({
        where: { id: targetMembership.id },
        data: { role: newRole, status: "ACTIVE" },
      })
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(targetMembership.user.clubId === clubId ? { role: newRole } : {}),
          sessionVersion: { increment: 1 },
        },
      })
    })

    registrarAuditoria({
      recurso: "user",
      accion: "actualizar",
      entidadId: userId,
      detalles: { tipo: "cambio-rol", rolAnterior: targetMembership.role, rolNuevo: newRole },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId,
    })

    return NextResponse.json({ success: true, userId, role: newRole })
  } catch (error) {
    logger.error("TEAM_ROLE", "Error al cambiar rol", { ruta: "/api/team/[userId]" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
