import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { CompetitionFormat } from "@prisma/client";

// --- AÑADIDO: Función helper para nombrar las rondas dinámicamente ---
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const competition = await db.competition.findUnique({
      where: { id: params.competitionId },
      select: { format: true, groupSize: true },
    });

    if (!competition) {
      return new NextResponse("Competición no encontrada", { status: 404 });
    }

    await db.match.deleteMany({ where: { competitionId: params.competitionId } });
    const teams = await db.team.findMany({
      where: { competitionId: params.competitionId },
      select: { id: true },
    });

    if (teams.length < 2) {
      return new NextResponse("Se necesitan al menos 2 equipos.", { status: 400 });
    }

    // 1. Borramos los partidos antiguos
    await db.match.deleteMany({ where: { competitionId: params.competitionId } });

    // 2. AÑADIDO: Reseteamos las estadísticas de todos los equipos de la competición
    await db.team.updateMany({
      where: { competitionId: params.competitionId },
      data: {
        points: 0,
        played: 0,
        won: 0,
        lost: 0,
        setsFor: 0,
        setsAgainst: 0,
        gamesFor: 0,
        gamesAgainst: 0,
      }
    });
    // --- LÓGICA CONDICIONAL COMPLETA Y CORRECTA ---
    if (competition.format === CompetitionFormat.LEAGUE) {
      let teamIds = teams.map(t => t.id);
      if (teamIds.length % 2 !== 0) teamIds.push("dummy");

      const numTeams = teamIds.length;
      const matchesToCreate: any[] = []; // Usamos 'any' para simplificar la creación de objetos
      const firstTeam = teamIds[0];
      const rotatingTeams = teamIds.slice(1);

      for (let i = 0; i < numTeams - 1; i++) {
        const roundNumber = i + 1;
        if (rotatingTeams[0] !== "dummy") {
          matchesToCreate.push({
            team1Id: firstTeam,
            team2Id: rotatingTeams[0],
            competitionId: params.competitionId,
            roundNumber,
            roundName: `Jornada ${roundNumber}`,
          });
        }
        for (let j = 1; j < numTeams / 2; j++) {
          if (rotatingTeams[j] !== "dummy" && rotatingTeams[numTeams - 1 - j] !== "dummy") {
            matchesToCreate.push({
              team1Id: rotatingTeams[j],
              team2Id: rotatingTeams[numTeams - 1 - j],
              competitionId: params.competitionId,
              roundNumber,
              roundName: `Jornada ${roundNumber}`,
            });
          }
        }
        rotatingTeams.unshift(rotatingTeams.pop()!);
      }
      await db.match.createMany({ data: matchesToCreate });
      return NextResponse.json({ message: "Calendario de liga generado con éxito." });

    } else if (competition.format === CompetitionFormat.KNOCKOUT) {
      // --- MODIFICADO: Lógica de Torneo Eliminatorio MEJORADA ---
      const teamIds = teams.map(t => t.id);
      const bracketSize = Math.pow(2, Math.ceil(Math.log2(teamIds.length)));
      const byes = bracketSize - teamIds.length;
      const participants = [...teamIds, ...Array(byes).fill(null)].sort(() => Math.random() - 0.5);

      const matchesToCreate: any[] = [];

      // 1. Crear la primera ronda con el nombre correcto
      const firstRoundName = getRoundName(bracketSize);
      for (let i = 0; i < bracketSize; i += 2) {
        matchesToCreate.push({
          team1Id: participants[i],
          team2Id: participants[i + 1],
          competitionId: params.competitionId,
          roundNumber: 1,
          roundName: firstRoundName,
          winnerId: participants[i + 1] === null ? participants[i] : null,
          result: participants[i + 1] === null ? "BYE" : null,
        });
      }

      // 2. Crear las rondas siguientes vacías con nombres correctos
      let roundNumber = 2;
      let teamsInNextRound = bracketSize / 2;
      while (teamsInNextRound >= 2) { // El bucle se detiene antes de la "ronda" de 1 equipo
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
      if (teams.length < groupSize) {
        return new NextResponse("No hay suficientes equipos para formar un grupo.", { status: 400 });
      }

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