import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// GET: Obtener perfil del jugador autenticado
export async function GET() {
  try {
    const auth = await requireAuth("profile:read")
    if (isAuthError(auth)) return auth

    const user = await db.user.findUnique({
      where: { id: auth.session.user.id },
      select: {
        id: true, name: true, email: true, phone: true,
        position: true, level: true, birthDate: true, image: true,
        role: true, clubId: true,
        club: { select: { name: true, slug: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET_PLAYER_PROFILE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH: Actualizar perfil propio
export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth("profile:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { name, phone, position, level } = body;

    const updatedUser = await db.user.update({
      where: { id: auth.session.user.id },
      data: { name, phone, position, level },
      select: {
        id: true, name: true, email: true, phone: true,
        position: true, level: true, birthDate: true, image: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[UPDATE_PLAYER_PROFILE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
