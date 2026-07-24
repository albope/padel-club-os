import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { registrarAuditoria } from "@/lib/audit";
import * as z from "zod";
import { normalizarEmail } from "@/lib/identity";

const UserUpdateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100, "El nombre no puede superar 100 caracteres.").optional(),
  email: z.string().email("Email no valido.").max(255).optional(),
  phone: z.string().max(20, "El telefono no puede superar 20 caracteres.").optional().or(z.literal("")).or(z.literal(null)),
  position: z.string().max(50, "La posicion no puede superar 50 caracteres.").optional().or(z.literal("")).or(z.literal(null)),
  level: z.string().max(10, "El nivel no puede superar 10 caracteres.").optional().or(z.literal("")).or(z.literal(null)),
  birthDate: z.string().optional().or(z.literal("")).or(z.literal(null)),
  isActive: z.boolean().optional(),
  adminNotes: z.string().max(5000, "Las notas no pueden superar 5000 caracteres.").optional().or(z.literal("")).or(z.literal(null)),
})

// PATCH: Actualizar datos de un socio
export async function PATCH(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAuth("users:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(UserUpdateSchema, body);
    if (!result.success) return result.response;
    const { name, email, phone, position, level, birthDate, isActive, adminNotes } = result.data;

    if (!params.userId) {
      return new NextResponse("ID de usuario requerido", { status: 400 });
    }

    if (auth.session.user.id === params.userId) {
      return new NextResponse("No puedes editar tu propia cuenta desde este panel", { status: 403 });
    }

    // Blindar: solo se pueden editar jugadores desde este endpoint
    const membership = await db.clubMembership.findFirst({
      where: {
        userId: params.userId,
        clubId: auth.session.user.clubId,
      },
      include: { user: true },
    });
    if (!membership) {
      return new NextResponse("Usuario no encontrado", { status: 404 });
    }
    if (membership.role !== "PLAYER") {
      return NextResponse.json(
        { error: "Usa la seccion Equipo para gestionar administradores y staff." },
        { status: 403 }
      );
    }

    const updatedUser = await db.$transaction(async (tx) => {
      if (typeof isActive === "boolean") {
        await tx.clubMembership.update({
          where: { id: membership.id },
          data: {
            status: isActive ? "ACTIVE" : "SUSPENDED",
            approvedAt: isActive ? new Date() : null,
            approvedById: isActive ? auth.session.user.id : null,
          },
        })
      }

      const otrasActivas = await tx.clubMembership.count({
        where: {
          userId: params.userId,
          status: "ACTIVE",
        },
      })

      return tx.user.update({
        where: { id: params.userId },
        data: {
          name,
          ...(email !== undefined ? { email: normalizarEmail(email) } : {}),
          phone,
          position,
          level,
          birthDate: birthDate ? new Date(birthDate) : null,
          ...(typeof isActive === "boolean"
            ? {
                isActive: otrasActivas > 0,
                sessionVersion: { increment: 1 },
              }
            : {}),
          ...(typeof adminNotes === 'string' || adminNotes === null ? { adminNotes } : {}),
        },
      });
    });

    registrarAuditoria({
      recurso: "user",
      accion: "actualizar",
      entidadId: params.userId,
      detalles: { campos: Object.keys(result.data) },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      position: updatedUser.position,
      level: updatedUser.level,
      birthDate: updatedUser.birthDate,
      adminNotes: updatedUser.adminNotes,
      isActive: typeof isActive === "boolean" ? isActive : membership.status === "ACTIVE",
      role: membership.role,
    });
  } catch (error) {
    logger.error("UPDATE_USER", "Error al actualizar socio", { ruta: "/api/users/[userId]" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Eliminar un socio
export async function DELETE(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAuth("users:delete")
    if (isAuthError(auth)) return auth

    if (!params.userId) {
      return new NextResponse("ID de usuario requerido", { status: 400 });
    }

    if (auth.session.user.id === params.userId) {
      return new NextResponse("No puedes eliminar tu propia cuenta", { status: 403 });
    }

    // Blindar: solo se pueden eliminar jugadores desde este endpoint
    const membership = await db.clubMembership.findFirst({
      where: {
        userId: params.userId,
        clubId: auth.session.user.clubId,
      },
      include: { user: { select: { email: true, name: true, clubId: true } } },
    });
    if (!membership) {
      return new NextResponse("Usuario no encontrado", { status: 404 });
    }
    if (membership.role !== "PLAYER") {
      return NextResponse.json(
        { error: "Usa la seccion Equipo para gestionar administradores y staff." },
        { status: 403 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.clubMembership.update({
        where: { id: membership.id },
        data: { status: "REVOKED" },
      })

      const siguiente = await tx.clubMembership.findFirst({
        where: { userId: params.userId, status: "ACTIVE" },
        orderBy: { joinedAt: "asc" },
        select: { clubId: true, role: true },
      })

      await tx.user.update({
        where: { id: params.userId },
        data: {
          isActive: Boolean(siguiente),
          clubId: siguiente?.clubId ?? null,
          role: siguiente?.role ?? "PLAYER",
          sessionVersion: { increment: 1 },
        },
      })
    });

    registrarAuditoria({
      recurso: "user",
      accion: "eliminar",
      entidadId: params.userId,
      detalles: { email: membership.user.email, nombre: membership.user.name, membershipId: membership.id },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("DELETE_USER", "Error al eliminar socio", { ruta: "/api/users/[userId]" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
