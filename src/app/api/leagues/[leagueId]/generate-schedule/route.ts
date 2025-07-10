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

    // 1. Limpiamos partidos antiguos para no duplicar el calendario
    await db.match.deleteMany({
      where: { leagueId: params.leagueId },
    });

    // 2. Obtenemos los equipos
    const teams = await db.team.findMany({
      where: { leagueId: params.leagueId },
      select: { id: true },
    });

    if (teams.length < 2) {
      return new NextResponse("Se necesitan al menos 2 equipos para generar un calendario.", { status: 400 });
    }

    let teamIds = teams.map(t => t.id);

    // 3. Si el número de equipos es impar, añadimos un equipo "fantasma".
    // Este equipo fantasma representa la jornada de DESCANSO.
    if (teamIds.length % 2 !== 0) {
      teamIds.push("dummy");
    }

    const numTeams = teamIds.length;
    const numRounds = numTeams - 1; // Para N equipos, hay N-1 jornadas.
    const matchesToCreate = [];

    // 4. Implementamos el algoritmo de rotación (Round Robin)
    // Fijamos al primer equipo y rotamos a los demás.
    const firstTeam = teamIds[0];
    const rotatingTeams = teamIds.slice(1);

    for (let i = 0; i < numRounds; i++) {
      const currentRound = i + 1; // Esta es la Jornada 1, 2, 3...

      // --- Partido para el equipo fijo ---
      // El equipo fijo siempre juega contra el primer equipo de la lista rotativa.
      const opponentForFirst = rotatingTeams[0];
      if (opponentForFirst !== "dummy") { // No se crea partido si el oponente es el "descanso"
        matchesToCreate.push({
          team1Id: firstTeam,
          team2Id: opponentForFirst,
          leagueId: params.leagueId,
          round: currentRound,
        });
      }

      // --- Partidos para el resto de equipos ---
      // Emparejamos a los demás equipos desde los extremos de la lista.
      // ej: [B, C, D, E] se empareja B vs E, y C vs D.
      for (let j = 1; j < numTeams / 2; j++) {
        const team1 = rotatingTeams[j];
        const team2 = rotatingTeams[numTeams - 1 - j];

        if (team1 !== "dummy" && team2 !== "dummy") {
          matchesToCreate.push({
            team1Id: team1,
            team2Id: team2,
            leagueId: params.leagueId,
            round: currentRound,
          });
        }
      }

      // --- La "magia" de la rotación ---
      // Movemos el último equipo de la lista rotativa al principio.
      // Esto crea los nuevos emparejamientos para la siguiente jornada.
      const lastTeam = rotatingTeams.pop();
      if (lastTeam) {
        rotatingTeams.unshift(lastTeam);
      }
    }

    // 5. Creamos todos los partidos en la base de datos de una sola vez.
    await db.match.createMany({
      data: matchesToCreate,
    });

    return NextResponse.json({ message: "Calendario generado con éxito." });

  } catch (error) {
    console.error("[GENERATE_SCHEDULE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}