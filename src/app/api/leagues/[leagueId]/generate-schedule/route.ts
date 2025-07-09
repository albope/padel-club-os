import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// This API route generates the match schedule for a league

export async function POST(
  req: Request,
  { params }: { params: { leagueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { startDate } = body; // Expect a start date from the request

    // Security and validation checks
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!startDate) {
      return new NextResponse("Se requiere una fecha de inicio.", { status: 400 });
    }

    const teams = await db.team.findMany({
      where: { leagueId: params.leagueId },
    });

    if (teams.length < 2) {
      return new NextResponse("Se necesitan al menos 2 equipos para generar un calendario.", { status: 400 });
    }

    // --- Round Robin Algorithm ---
    const matchesToCreate = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matchesToCreate.push({
          team1Id: teams[i].id,
          team2Id: teams[j].id,
          leagueId: params.leagueId,
          round: 1, // Let's start with round 1
          matchDate: new Date(startDate), // Assign the provided date to all matches
        });
      }
    }

    // Delete existing matches to prevent duplicates if regenerating
    await db.match.deleteMany({
      where: { leagueId: params.leagueId },
    });
    
    // Create all new matches
    await db.match.createMany({
      data: matchesToCreate,
    });

    return NextResponse.json({ message: "Calendario generado con éxito." });

  } catch (error) {
    console.error("[GENERATE_SCHEDULE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}