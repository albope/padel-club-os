import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { CompetitionFormat } from "@prisma/client";

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
      select: { format: true, groupSize: true }, // Obtenemos el tamaño de grupo
    });

    if (!competition) {
      return new NextResponse("Competición no encontrada", { status: 404 });
    }

    await db.match.deleteMany({ where: { competitionId: params.competitionId } });
    const teams = await db.team.findMany({
      where: { competitionId: params.competitionId },
      select: { id: true },
    });

    if (teams.length < 2) { /* ... */ }

    // --- LÓGICA CONDICIONAL BASADA EN EL FORMATO ---

    if (competition.format === CompetitionFormat.LEAGUE) {
      // ... Lógica de Liga (sin cambios) ...

    } else if (competition.format === CompetitionFormat.KNOCKOUT) {
      // ... Lógica de Torneo Eliminatorio (sin cambios) ...

    } else if (competition.format === CompetitionFormat.GROUP_AND_KNOCKOUT) {
      // --- AÑADIDO: Lógica para Fase de Grupos ---
      const groupSize = competition.groupSize || 4; // Usamos 4 como default
      if (teams.length < groupSize) {
        return new NextResponse("No hay suficientes equipos para formar un grupo.", { status: 400 });
      }

      const shuffledTeams = teams.map(t => t.id).sort(() => Math.random() - 0.5);
      const numGroups = Math.ceil(shuffledTeams.length / groupSize);
      const groups: { [key: string]: string[] } = {};
      const teamUpdatePromises = [];

      // 1. Asignar equipos a grupos
      for (let i = 0; i < numGroups; i++) {
        const groupName = String.fromCharCode(65 + i); // "A", "B", "C"...
        const groupTeams = shuffledTeams.splice(0, groupSize);
        groups[groupName] = groupTeams;

        // Preparamos la actualización para asignar el grupo a cada equipo
        teamUpdatePromises.push(
          db.team.updateMany({
            where: { id: { in: groupTeams } },
            data: { group: groupName },
          })
        );
      }
      
      // Ejecutamos todas las actualizaciones de equipos
      await db.$transaction(teamUpdatePromises);

      const matchesToCreate = [];

      // 2. Generar partidos (Round Robin) para cada grupo
      for (const groupName in groups) {
        let teamIds = groups[groupName];
        if (teamIds.length % 2 !== 0) teamIds.push("dummy");

        const numTeams = teamIds.length;
        const numRounds = numTeams - 1;
        const firstTeam = teamIds[0];
        const rotatingTeams = teamIds.slice(1);

        for (let i = 0; i < numRounds; i++) {
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