import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import * as z from "zod";

const RegistroAdminSchema = z.object({
  email: z.string().email("Email no valido.").max(255),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres.").max(128),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
});

const limiter = crearRateLimiter({ maxRequests: 5, windowMs: 60 * 60 * 1000 });

// Genera un slug unico a partir de un nombre
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  let counter = 1;

  while (await db.club.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

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
    const parsed = RegistroAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    const existingUserByEmail = await db.user.findUnique({
      where: { email: email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "Ya existe un usuario con este email." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);
    const clubName = `${name}'s Club`;
    const slug = await generateUniqueSlug(clubName);

    const newUser = await db.$transaction(async (prisma) => {
      const newClub = await prisma.club.create({
        data: {
          name: clubName,
          slug,
          subscriptionStatus: "trialing",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
        },
      });

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          clubId: newClub.id,
          role: "CLUB_ADMIN",
        },
      });

      return user;
    });

    const { password: newUserPassword, ...rest } = newUser;
    return NextResponse.json(
      { user: rest, message: "Usuario y club creados con éxito." },
      { status: 201 }
    );

  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}