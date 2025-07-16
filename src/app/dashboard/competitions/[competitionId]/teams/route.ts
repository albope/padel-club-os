import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// API route to add a team to a specific league

export async function POST(
  req: Request,
  { params }: { params: { leagueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, player1Id, player2Id } = body;

    // Security: Ensure user is authenticated and is an admin of a club
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validation: Ensure all required fields are present
    if (!name || !player1Id || !player2Id) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (player1Id === player2Id) {
      return new NextResponse("Players must be different", { status: 400 });
    }

    // Logic: Create the new team in the database
    const newTeam = await db.team.create({
      data: {
        name,
        player1Id,
        player2Id,
        leagueId: params.leagueId,
      },
    });

    return NextResponse.json(newTeam, { status: 201 });

  } catch (error) {
    console.error("[ADD_TEAM_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}