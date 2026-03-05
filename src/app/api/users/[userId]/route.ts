import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { logger } from "@/lib/logger";
import * as z from "zod";

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
export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
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

    const updatedUser = await db.user.update({
      where: { id: params.userId, clubId: auth.session.user.clubId },
      data: {
        name, email, phone, position, level,
        birthDate: birthDate ? new Date(birthDate) : null,
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(typeof adminNotes === 'string' || adminNotes === null ? { adminNotes } : {}),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error("UPDATE_USER", "Error al actualizar socio", { ruta: "/api/users/[userId]" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Eliminar un socio
export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const auth = await requireAuth("users:delete")
    if (isAuthError(auth)) return auth

    if (!params.userId) {
      return new NextResponse("ID de usuario requerido", { status: 400 });
    }

    if (auth.session.user.id === params.userId) {
      return new NextResponse("No puedes eliminar tu propia cuenta", { status: 403 });
    }

    await db.user.delete({
      where: { id: params.userId, clubId: auth.session.user.clubId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("DELETE_USER", "Error al eliminar socio", { ruta: "/api/users/[userId]" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
