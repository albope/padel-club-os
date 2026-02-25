import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { isSubscriptionActive, canCreateMember } from "@/lib/subscription";
import * as z from "zod";

const RegistroJugadorSchema = z.object({
  email: z.string().email("Email no valido.").max(255),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres.").max(128),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  slug: z.string().min(1, "Slug del club requerido.").max(100),
});

const limiter = crearRateLimiter({ maxRequests: 5, windowMs: 60 * 60 * 1000 });

// POST: Registro de jugador en un club especifico (requiere slug valido)
export async function POST(req: Request) {
  try {
    const ip = obtenerIP(req);
    if (!limiter.verificar(ip)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentalo de nuevo mas tarde." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RegistroJugadorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name, phone, slug } = parsed.data;

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
