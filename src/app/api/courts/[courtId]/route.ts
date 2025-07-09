import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// API route to handle specific courts by their ID

// PATCH function to update a court
export async function PATCH(
  req: Request,
  { params }: { params: { courtId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, type } = body;

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.courtId) {
      return new NextResponse("Court ID is required", { status: 400 });
    }

    const updatedCourt = await db.court.update({
      where: {
        id: params.courtId,
        clubId: session.user.clubId, // Ensure user can only update their own club's courts
      },
      data: {
        name,
        type,
      },
    });

    return NextResponse.json(updatedCourt);
  } catch (error) {
    console.error("[UPDATE_COURT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE function to remove a court
export async function DELETE(
  req: Request,
  { params }: { params: { courtId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.courtId) {
      return new NextResponse("Court ID is required", { status: 400 });
    }

    await db.court.delete({
      where: {
        id: params.courtId,
        clubId: session.user.clubId, // Security check
      },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error("[DELETE_COURT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}