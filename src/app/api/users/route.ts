import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";

// API route to handle users (socios)

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // --- MODIFICADO ---: Desestructuramos los nuevos campos del body
    const body = await req.json();
    const { email, name, password, phone, position, level, birthDate } = body;

    if (!email || !name || !password) {
      return new NextResponse("Faltan campos requeridos", { status: 400 });
    }

    // ... (comprobación de usuario existente)

    const hashedPassword = await hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone,
        clubId: session.user.clubId,
        // --- AÑADIDO ---: Guardamos los nuevos datos
        position,
        level,
        // Si birthDate viene como string, lo convertimos a Date
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("[CREATE_USER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}