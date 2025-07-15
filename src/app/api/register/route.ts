import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

// This API route now handles user registration AND initial club creation

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    // 1. Validation
    if (!email || !password || !name) {
      return new NextResponse("Faltan campos requeridos.", { status: 400 });
    }

    // 2. Check if user already exists
    const existingUserByEmail = await db.user.findUnique({
      where: { email: email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "Ya existe un usuario con este email." },
        { status: 409 } // 409 Conflict
      );
    }
    
    // 3. Hash the password
    const hashedPassword = await hash(password, 10);

    // 4. Use a transaction to create the Club and the User together
    // This ensures that if one fails, the other is rolled back.
    const newUser = await db.$transaction(async (prisma) => {
      // First, create the club for this new admin
      const newClub = await prisma.club.create({
        data: {
          name: `${name}'s Club`,
        },
      });

      // Then, create the user and assign them to the new club
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          clubId: newClub.id, // Assign the new club's ID
        },
      });

      return user;
    });

    // 5. Return the newly created user (without the password)
    const { password: newUserPassword, ...rest } = newUser;
    return NextResponse.json(
      { user: rest, message: "Usuario y club creados con éxito." },
      { status: 201 } // 201 Created
    );

  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}