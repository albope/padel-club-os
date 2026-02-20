import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { CompetitionFormat } from "@prisma/client";

function getRoundName(teamsInRound: number): string {
  switch (teamsInRound) {
    case 2: return "Final";
    case 4: return "Semifinales";
    case 8: return "Cuartos de Final";
    case 16: return "Octavos de Final";
    case 32: return "Ronda de 32";
    default: return `Ronda de ${teamsInRound}`;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    // Verificar que la competicion pertenece al club
    const competition = await db.competition.findFirst({
      where: { id: params.competitionId, clubId: auth.session.user.clubId },
      select: { format: true, groupSize: true, rounds: true },
    });

    if (!competition) {
      return new NextResponse("Competición no encontrada", { status: 404 });
    }

    const teams = await db.team.findMany({
      where: { competitionId: params.competitionId },
      select: { id: true },
    });

    if (teams.length < 2) {
      return new NextResponse("Se necesitan al menos 2 equipos.", { status: 400 });
    }

    await db.match.deleteMany({ where: { competitionId: params.competitionId } });
    await db.team.updateMany({
      where: { competitionId: params.competitionId },
      data: {
        points: 0, played: 0, won: 0, lost: 0,
        setsFor: 0, setsAgainst: 0, gamesFor: 0, gamesAgainst: 0,
      }
    });

    if (competition.format === CompetitionFormat.LEAGUE) {
      let teamIds = teams.map(t => t.id);
      if (teamIds.length % 2 !== 0) teamIds.push("dummy");

      const numTeams = teamIds.length;
      const numRoundsIda = numTeams - 1;
      const matchesToCreate: any[] = [];
      const firstTeam = teamIds[0];
      const rotatingTeams = teamIds.slice(1);

      for (let i = 0; i < numRoundsIda; i++) {
        const roundNumber = i + 1;
        if (rotatingTeams[0] !== "dummy") {
          matchesToCreate.push({
            team1Id: firstTeam, team2Id: rotatingTeams[0],
            competitionId: params.competitionId, roundNumber, roundName: `Jornada ${roundNumber}`,
          });
        }
        for (let j = 1; j < numTeams / 2; j++) {
          if (rotatingTeams[j] !== "dummy" && rotatingTeams[numTeams - 1 - j] !== "dummy") {
            matchesToCreate.push({
              team1Id: rotatingTeams[j], team2Id: rotatingTeams[numTeams - 1 - j],
              competitionId: params.competitionId, roundNumber, roundName: `Jornada ${roundNumber}`,
            });
          }
        }
        rotatingTeams.unshift(rotatingTeams.pop()!);
      }

      if (competition.rounds === 2) {
        const matchesIda = [...matchesToCreate];
        for (const matchIda of matchesIda) {
          const roundNumberVuelta = matchIda.roundNumber + numRoundsIda;
          matchesToCreate.push({
            team1Id: matchIda.team2Id, team2Id: matchIda.team1Id,
            competitionId: params.competitionId, roundNumber: roundNumberVuelta,
            roundName: `Jornada ${roundNumberVuelta}`,
          });
        }
      }

      await db.match.createMany({ data: matchesToCreate });
      return NextResponse.json({ message: "Calendario de liga generado con éxito." });

    } else if (competition.format === CompetitionFormat.KNOCKOUT) {
      const teamIds = teams.map(t => t.id);
      const bracketSize = Math.pow(2, Math.ceil(Math.log2(teamIds.length)));
      const byes = bracketSize - teamIds.length;
      const participants = [...teamIds, ...Array(byes).fill(null)].sort(() => Math.random() - 0.5);
      const matchesToCreate: any[] = [];
      const firstRoundName = getRoundName(bracketSize);
      for (let i = 0; i < bracketSize; i += 2) {
        matchesToCreate.push({
          team1Id: participants[i], team2Id: participants[i + 1],
          competitionId: params.competitionId, roundNumber: 1, roundName: firstRoundName,
          winnerId: participants[i + 1] === null ? participants[i] : null,
          result: participants[i + 1] === null ? "BYE" : null,
        });
      }
      let roundNumber = 2;
      let teamsInNextRound = bracketSize / 2;
      while (teamsInNextRound >= 2) {
        const roundName = getRoundName(teamsInNextRound);
        for (let i = 0; i < teamsInNextRound / 2; i++) {
          matchesToCreate.push({ competitionId: params.competitionId, roundNumber, roundName });
        }
        teamsInNextRound /= 2;
        roundNumber++;
      }
      await db.match.createMany({ data: matchesToCreate });
      return NextResponse.json({ message: "Bracket de torneo generado con éxito." });

    } else if (competition.format === CompetitionFormat.GROUP_AND_KNOCKOUT) {
      const groupSize = competition.groupSize || 4;
      if (teams.length < groupSize) return new NextResponse("No hay suficientes equipos para formar un grupo.", { status: 400 });
      const shuffledTeams = teams.map(t => t.id).sort(() => Math.random() - 0.5);
      const numGroups = Math.ceil(shuffledTeams.length / groupSize);
      const groups: { [key: string]: string[] } = {};
      const teamUpdatePromises = [];
      for (let i = 0; i < numGroups; i++) {
        const groupName = String.fromCharCode(65 + i);
        const groupTeams = shuffledTeams.splice(0, groupSize);
        groups[groupName] = groupTeams;
        teamUpdatePromises.push(db.team.updateMany({ where: { id: { in: groupTeams } }, data: { group: groupName } }));
      }
      await db.$transaction(teamUpdatePromises);
      const matchesToCreate: any[] = [];
      for (const groupName in groups) {
        let teamIds = groups[groupName];
        if (teamIds.length % 2 !== 0) teamIds.push("dummy");
        const numTeams = teamIds.length;
        const firstTeam = teamIds[0];
        const rotatingTeams = teamIds.slice(1);
        for (let i = 0; i < numTeams - 1; i++) {
          const roundNumber = i + 1;
          if (rotatingTeams[0] !== "dummy") {
            matchesToCreate.push({ team1Id: firstTeam, team2Id: rotatingTeams[0], competitionId: params.competitionId, roundNumber, roundName: `Grupo ${groupName} - Jornada ${roundNumber}` });
          }
          for (let j = 1; j < numTeams / 2; j++) {
            if (rotatingTeams[j] !== "dummy" && rotatingTeams[numTeams - 1 - j] !== "dummy") {
              matchesToCreate.push({ team1Id: rotatingTeams[j], team2Id: rotatingTeams[numTeams - 1 - j], competitionId: params.competitionId, roundNumber, roundName: `Grupo ${groupName} - Jornada ${roundNumber}` });
            }
          }
          rotatingTeams.unshift(rotatingTeams.pop()!);
        }
      }
      await db.match.createMany({ data: matchesToCreate });
      return NextResponse.json({ message: "Fase de grupos generada con éxito." });
    }

    return new NextResponse("Formato de competición no soportado.", { status: 400 });
  } catch (error) {
    console.error("[GENERATE_MATCHES_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
