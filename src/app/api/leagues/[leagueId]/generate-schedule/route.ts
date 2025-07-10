// src/app/api/leagues/[leagueId]/generate-schedule/route.ts

import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { leagueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.match.deleteMany({
      where: { leagueId: params.leagueId },
    });

    const teams = await db.team.findMany({
      where: { leagueId: params.leagueId },
      select: { id: true },
    });

    if (teams.length < 2) {
      return new NextResponse("Se necesitan al menos 2 equipos para generar un calendario.", { status: 400 });
    }

    let teamIds = teams.map(t => t.id);

    if (teamIds.length % 2 !== 0) {
      teamIds.push("dummy");
    }

    const numTeams = teamIds.length;
    const numRounds = numTeams - 1;
    const matchesToCreate = [];
    
    const firstTeam = teamIds[0];
    const rotatingTeams = teamIds.slice(1);

    for (let i = 0; i < numRounds; i++) {
      // CORREGIDO: Usamos el nombre 'round' que espera tu esquema
      const currentRound = i + 1;

      const opponentForFirst = rotatingTeams[0];
      if (opponentForFirst !== "dummy") {
        matchesToCreate.push({
          team1Id: firstTeam,
          team2Id: opponentForFirst,
          leagueId: params.leagueId,
          round: currentRound, // CORREGIDO
        });
      }

      for (let j = 1; j < numTeams / 2; j++) {
        const team1 = rotatingTeams[j];
        const team2 = rotatingTeams[numTeams - 1 - j];

        if (team1 !== "dummy" && team2 !== "dummy") {
          matchesToCreate.push({
            team1Id: team1,
            team2Id: team2,
            leagueId: params.leagueId,
            round: currentRound, // CORREGIDO
          });
        }
      }

      const lastTeam = rotatingTeams.pop();
      if (lastTeam) {
        rotatingTeams.unshift(lastTeam);
      }
    }

    // CORREGIDO: La data ahora coincide con el tipo MatchCreateManyInput
    await db.match.createMany({
      data: matchesToCreate,
    });

    return NextResponse.json({ message: "Calendario generado con éxito." });

  } catch (error) {
    console.error("[GENERATE_SCHEDULE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}