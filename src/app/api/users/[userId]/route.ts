import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// PATCH: Actualizar datos de un socio
export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const auth = await requireAuth("users:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { name, email, phone, position, level, birthDate } = body;

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
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[UPDATE_USER_ERROR]", error);
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
    console.error("[DELETE_USER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
