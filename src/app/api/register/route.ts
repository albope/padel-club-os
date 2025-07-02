import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

// This file defines the API route for user registration.

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    // 1. Check if a user with this email already exists
    const existingUserByEmail = await db.user.findUnique({
      where: { email: email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "Ya existe un usuario con este email." },
        { status: 409 } // 409 Conflict
      );
    }
    
    // 2. Hash the password for security
    const hashedPassword = await hash(password, 10);

    // 3. Create the new user in the database
    const newUser = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Remove password from the response for security
    const { password: newUserPassword, ...rest } = newUser;

    // 4. Return the newly created user (without the password)
    return NextResponse.json(
      { user: rest, message: "Usuario creado con éxito." },
      { status: 201 } // 201 Created
    );
  } catch (error) {
    // Log the detailed error to the server console for debugging
    console.error("[REGISTER_ERROR]", error); 
    
    return NextResponse.json(
      { message: "Algo salió mal en el servidor." },
      { status: 500 } // 500 Internal Server Error
    );
  }
}