import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

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
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return new NextResponse("Faltan campos requeridos.", { status: 400 });
    }

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