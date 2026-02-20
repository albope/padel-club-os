import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";

// POST: Crear un nuevo socio
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("users:create")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { email, name, password, phone, position, level, birthDate } = body;

    if (!email || !name || !password) {
      return new NextResponse("Faltan campos requeridos", { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return new NextResponse("Ya existe un usuario con ese email", { status: 409 });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email, name,
        password: hashedPassword,
        phone, position, level,
        birthDate: birthDate ? new Date(birthDate) : null,
        clubId: auth.session.user.clubId,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("[CREATE_USER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
