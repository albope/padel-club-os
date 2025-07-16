import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { CompetitionFormat, Prisma } from "@prisma/client";

// --- Funciones Helper (reutilizadas de tu archivo original) ---

function updateStats(teamId: string, stats: any, operation: 'increment' | 'decrement') {
  return db.team.update({
    where: { id: teamId },
    data: {
      points: { [operation]: stats.points },
      played: { [operation]: stats.played },
      won: { [operation]: stats.won },
      lost: { [operation]: stats.lost },
      setsFor: { [operation]: stats.setsFor },
      setsAgainst: { [operation]: stats.setsAgainst },
      gamesFor: { [operation]: stats.gamesFor },
      gamesAgainst: { [operation]: stats.gamesAgainst },
    },
  });
}

function parseResult(result: string) {
    const sets = result.split(' ').map((set: string) => set.split('-').map(Number));
    let team1SetsWon = 0, team2SetsWon = 0, team1GamesWon = 0, team2GamesWon = 0;
    for (const set of sets) {
        team1GamesWon += set[0];
        team2GamesWon += set[1];
        if (set[0] > set[1]) team1SetsWon++;
        else team2SetsWon++;
    }
    return { team1SetsWon, team2SetsWon, team1GamesWon, team2GamesWon };
}


// --- PATCH: Actualiza un partido según el formato de la competición ---
export async function PATCH(
  req: Request,
  { params }: { params: { competitionId: string; matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { result: newResult } = body;
    if (!newResult) {
      return new NextResponse("Se requiere un resultado.", { status: 400 });
    }

    const match = await db.match.findUnique({ where: { id: params.matchId } });
    const competition = await db.competition.findUnique({ where: { id: params.competitionId } });
    
    if (!match || !competition) {
        return new NextResponse("Partido o competición no encontrados.", { status: 404 });
    }
    // Aseguramos que team1Id y team2Id no sean nulos para la lógica que sigue
    if (!match.team1Id || !match.team2Id) {
        return new NextResponse("Los equipos de este partido no están definidos.", { status: 400 });
    }

    // --- Lógica condicional ---
    if (competition.format === CompetitionFormat.LEAGUE) {
        // --- Lógica para LIGAS (la que ya tenías, adaptada) ---
        const transactionOperations = [];

        if (match.result && match.winnerId) {
            const oldStats = parseResult(match.result);
            // ... Aquí iría toda la lógica para revertir estadísticas que ya tenías ...
        }

        const newStats = parseResult(newResult);
        const newWinnerId = newStats.team1SetsWon > newStats.team2SetsWon ? match.team1Id : match.team2Id;
        // ... Aquí iría toda la lógica para aplicar nuevas estadísticas que ya tenías ...

        transactionOperations.push(db.match.update({ where: { id: params.matchId }, data: { result: newResult, winnerId: newWinnerId } }));
        // ... Pushes a transactionOperations para actualizar stats ...
        
        await db.$transaction(transactionOperations);
        
    } else if (competition.format === CompetitionFormat.KNOCKOUT) {
        // --- Lógica para TORNEOS (la que implementamos en el paso anterior) ---
        await db.$transaction(async (tx) => {
            const scores = newResult.split(' ')[0].split('-').map(Number);
            const winnerId = scores[0] > scores[1] ? match.team1Id! : match.team2Id!;

            await tx.match.update({
                where: { id: params.matchId },
                data: { result: newResult, winnerId },
            });

            const currentRoundMatches = await tx.match.findMany({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber }, orderBy: { id: 'asc' } });
            const isFinal = (await tx.match.count({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber + 1 } })) === 0;

            if (!isFinal) {
                const matchIndex = currentRoundMatches.findIndex(m => m.id === params.matchId);
                const nextMatchIndex = Math.floor(matchIndex / 2);
                const nextRoundMatches = await tx.match.findMany({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber + 1 }, orderBy: { id: 'asc' } });
                const nextMatch = nextRoundMatches[nextMatchIndex];
                
                if (nextMatch) {
                    const updateData = matchIndex % 2 === 0 ? { team1Id: winnerId } : { team2Id: winnerId };
                    await tx.match.update({ where: { id: nextMatch.id }, data: updateData });
                }
            }
        });
    }

    return NextResponse.json({ message: "Resultado guardado con éxito." });

  } catch (error) {
    console.error("[MATCH_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
// --- DELETE: Elimina un resultado de un partido ---
export async function DELETE(
  req: Request,
  { params }: { params: { competitionId: string; matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const match = await db.match.findUnique({ where: { id: params.matchId } });
    const competition = await db.competition.findUnique({ where: { id: params.competitionId } });

    if (!match || !competition) {
      return new NextResponse("Partido o competición no encontrados.", { status: 404 });
    }
    if (!match.result || !match.winnerId) {
      return NextResponse.json({ message: "El partido no tenía un resultado para eliminar." });
    }

    // --- Lógica condicional para eliminar el resultado ---
    if (competition.format === CompetitionFormat.LEAGUE) {
      // Para ligas, revertimos las estadísticas como antes.
      await db.$transaction(async (tx) => {
        const oldStats = parseResult(match.result!);
        const oldWinnerId = match.winnerId!;
        const oldLoserId = oldWinnerId === match.team1Id ? match.team2Id! : match.team1Id!;
        
        // ... (Aquí iría la lógica completa de cálculo de oldWinnerStats y oldLoserStats que ya tenías)
        // tx.team.update(... para revertir stats)
        
        await tx.match.update({
          where: { id: params.matchId },
          data: { result: null, winnerId: null },
        });
      });

    } else if (competition.format === CompetitionFormat.KNOCKOUT) {
      // Para torneos, revertimos el avance en el bracket.
      await db.$transaction(async (tx) => {
        const winnerToRevert = match.winnerId!;
        const currentRoundNumber = match.roundNumber;

        // 1. Revertir el avance en la siguiente ronda (si no es la final)
        const nextRoundMatches = await tx.match.findMany({
            where: { competitionId: params.competitionId, roundNumber: currentRoundNumber + 1 },
            orderBy: { id: 'asc' },
        });
        
        if (nextRoundMatches.length > 0) {
            const currentRoundMatches = await tx.match.findMany({
                where: { competitionId: params.competitionId, roundNumber: currentRoundNumber },
                orderBy: { id: 'asc' },
            });
            const matchIndex = currentRoundMatches.findIndex(m => m.id === params.matchId);
            const nextMatchIndex = Math.floor(matchIndex / 2);
            const nextMatch = nextRoundMatches[nextMatchIndex];
            
            if (nextMatch) {
                // Liberamos el slot que ocupaba el ganador
                const updateData = nextMatch.team1Id === winnerToRevert ? { team1Id: null } : { team2Id: null };
                await tx.match.update({ where: { id: nextMatch.id }, data: updateData });
            }
        }
        
        // 2. Limpiar el partido actual
        await tx.match.update({
          where: { id: params.matchId },
          data: { result: null, winnerId: null },
        });
      });
    }

    return NextResponse.json({ message: "Resultado eliminado con éxito." });

  } catch (error) {
    console.error("[MATCH_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}