import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";

// API route to handle users (socios)

// POST function to create a new user (socio) by an admin
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { email, name, password, phone } = body; // Added phone

    if (!email || !name || !password) {
      return new NextResponse("Faltan campos requeridos", { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return new NextResponse("Ya existe un usuario con este email", { status: 409 });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone, // Added phone
        clubId: session.user.clubId,
      },
    });

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error("[CREATE_USER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}