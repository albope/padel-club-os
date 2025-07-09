import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// API route to handle specific users (socios) by their ID

// PATCH function to update a user's details
export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, email, phone } = body; // Added phone

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Ensure admin cannot change their own details this way for safety
    if (session.user.id === params.userId) {
        return new NextResponse("Cannot edit your own account from this panel", { status: 403 });
    }

    const updatedUser = await db.user.update({
      where: {
        id: params.userId,
        clubId: session.user.clubId, // Security check
      },
      data: {
        name,
        email,
        phone, // Added phone to the update data
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[UPDATE_USER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE function to remove a user
export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Prevent an admin from deleting themselves
    if (session.user.id === params.userId) {
        return new NextResponse("Cannot delete your own account", { status: 403 });
    }

    await db.user.delete({
      where: {
        id: params.userId,
        clubId: session.user.clubId, // Security check
      },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error("[DELETE_USER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}