import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// API route to handle specific teams by their ID

// PATCH function to update a team
export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, player1Id, player2Id } = body;

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!params.teamId) {
      return new NextResponse("Team ID is required", { status: 400 });
    }

    const updatedTeam = await db.team.update({
      where: { id: params.teamId },
      data: { name, player1Id, player2Id },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("[UPDATE_TEAM_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE function to remove a team
export async function DELETE(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!params.teamId) {
      return new NextResponse("Team ID is required", { status: 400 });
    }

    await db.team.delete({
      where: { id: params.teamId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE_TEAM_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}