import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import { isSubscriptionActive } from "@/lib/subscription";
import { canCreateMember } from "@/lib/subscription";

// POST: Registro de jugador en un club especifico (requiere slug valido)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, phone, slug } = body;

    if (!email || !password || !name || !slug) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (email, password, name, slug)." },
        { status: 400 }
      );
    }

    // Verificar que el club existe
    const club = await db.club.findUnique({
      where: { slug },
      select: { id: true, subscriptionStatus: true, trialEndsAt: true },
    });
    if (!club) {
      return NextResponse.json(
        { error: "Club no encontrado." },
        { status: 404 }
      );
    }

    // Verificar que la suscripcion del club esta activa
    if (!isSubscriptionActive(club.subscriptionStatus, club.trialEndsAt)) {
      return NextResponse.json(
        { error: "Este club no tiene una suscripcion activa. Contacta con el administrador del club." },
        { status: 403 }
      );
    }

    // Verificar limite de socios del plan
    const check = await canCreateMember(club.id)
    if (!check.allowed) {
      return NextResponse.json(
        { error: "Este club ha alcanzado el limite de socios de su plan. Contacta con el administrador del club." },
        { status: 403 }
      );
    }

    // Verificar que el email no esta en uso
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone: phone || null,
        clubId: club.id,
        role: "PLAYER",
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(
      { user: userWithoutPassword, message: "Registro exitoso." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_PLAYER_ERROR]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
