import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { CompetitionFormat, Prisma } from "@prisma/client";

// --- Funciones Helper ---
function updateStats(tx: Prisma.TransactionClient, teamId: string, stats: any, operation: 'increment' | 'decrement') {
  return tx.team.update({
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

// --- CORREGIDO: parseResult ahora usa coma como separador ---
function parseResult(result: string) {
    const sets = result.split(',').map((set: string) => set.trim().split('-').map(s => parseInt(s, 10)));
    let team1SetsWon = 0, team2SetsWon = 0, team1GamesWon = 0, team2GamesWon = 0;
    for (const set of sets) {
        if (isNaN(set[0]) || isNaN(set[1])) continue;
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
    if (!session?.user?.clubId) { return new NextResponse("Unauthorized", { status: 401 }); }

    const body = await req.json();
    const { result: newResult } = body;
    if (!newResult) { return new NextResponse("Se requiere un resultado.", { status: 400 }); }

    // Sanitizamos el resultado para asegurar el formato "6-2,6-4"
    const sanitizedResult = newResult.replace(/\s/g, '');

    const match = await db.match.findUnique({ where: { id: params.matchId } });
    const competition = await db.competition.findUnique({ where: { id: params.competitionId } });
    
    if (!match || !competition) { return new NextResponse("Partido o competición no encontrados.", { status: 404 });}
    if (!match.team1Id || !match.team2Id) { return new NextResponse("Los equipos de este partido no están definidos.", { status: 400 }); }

    if (competition.format === CompetitionFormat.LEAGUE || competition.format === CompetitionFormat.GROUP_AND_KNOCKOUT) {
        return await db.$transaction(async (tx) => {
            if (match.result && match.winnerId) {
                const oldStats = parseResult(match.result);
                const oldWinnerId = match.winnerId;
                const oldLoserId = oldWinnerId === match.team1Id ? match.team2Id! : match.team1Id!;
                
                const oldWinnerStats = { points: 2, played: 1, won: 1, lost: 0, setsFor: oldWinnerId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon, setsAgainst: oldWinnerId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon, gamesFor: oldWinnerId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon, gamesAgainst: oldWinnerId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon };
                const oldLoserStats = { points: 0, played: 1, won: 0, lost: 1, setsFor: oldLoserId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon, setsAgainst: oldLoserId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon, gamesFor: oldLoserId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon, gamesAgainst: oldLoserId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon };

                await updateStats(tx, oldWinnerId, oldWinnerStats, 'decrement');
                await updateStats(tx, oldLoserId, oldLoserStats, 'decrement');
            }

            const newStats = parseResult(sanitizedResult);
            const newWinnerId = newStats.team1SetsWon > newStats.team2SetsWon ? match.team1Id! : match.team2Id!;
            const newLoserId = newWinnerId === match.team1Id ? match.team2Id! : match.team1Id!;
            
            const newWinnerStats = { points: 2, played: 1, won: 1, lost: 0, setsFor: newWinnerId === match.team1Id ? newStats.team1SetsWon : newStats.team2SetsWon, setsAgainst: newWinnerId === match.team1Id ? newStats.team2SetsWon : newStats.team1SetsWon, gamesFor: newWinnerId === match.team1Id ? newStats.team1GamesWon : newStats.team2GamesWon, gamesAgainst: newWinnerId === match.team1Id ? newStats.team2GamesWon : newStats.team1GamesWon };
            const newLoserStats = { points: 0, played: 1, won: 0, lost: 1, setsFor: newLoserId === match.team1Id ? newStats.team1SetsWon : newStats.team2SetsWon, setsAgainst: newLoserId === match.team1Id ? newStats.team2SetsWon : newStats.team1SetsWon, gamesFor: newLoserId === match.team1Id ? newStats.team1GamesWon : newStats.team2GamesWon, gamesAgainst: newLoserId === match.team1Id ? newStats.team2GamesWon : newStats.team1GamesWon };
            
            await updateStats(tx, newWinnerId, newWinnerStats, 'increment');
            await updateStats(tx, newLoserId, newLoserStats, 'increment');

            await tx.match.update({ where: { id: params.matchId }, data: { result: sanitizedResult, winnerId: newWinnerId } });
            
            return NextResponse.json({ message: "Resultado guardado y estadísticas actualizadas." });
        });
    } else if (competition.format === CompetitionFormat.KNOCKOUT) {
        return await db.$transaction(async (tx) => {
            const newStats = parseResult(sanitizedResult);
            const winnerId = newStats.team1SetsWon > newStats.team2SetsWon ? match.team1Id! : match.team2Id!;
            
            await tx.match.update({ where: { id: params.matchId }, data: { result: sanitizedResult, winnerId } });
            
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
            return NextResponse.json({ message: "Resultado guardado y bracket actualizado." });
        });
    }

    return new NextResponse("Formato no válido.", { status: 400 });
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
        if (!session?.user?.clubId) { return new NextResponse("Unauthorized", { status: 401 }); }

        const match = await db.match.findUnique({ where: { id: params.matchId } });
        const competition = await db.competition.findUnique({ where: { id: params.competitionId } });

        if (!match || !competition) { return new NextResponse("Partido o competición no encontrados.", { status: 404 }); }
        if (!match.result || !match.winnerId) { return NextResponse.json({ message: "El partido no tenía un resultado para eliminar." }); }
        if (!match.team1Id || !match.team2Id) { return new NextResponse("Los equipos de este partido no están definidos.", { status: 400 }); }

        await db.$transaction(async (tx) => {
            if (competition.format === CompetitionFormat.LEAGUE || competition.format === CompetitionFormat.GROUP_AND_KNOCKOUT) {
                const oldStats = parseResult(match.result!);
                const oldWinnerId = match.winnerId!;
                const oldLoserId = oldWinnerId === match.team1Id ? match.team2Id! : match.team1Id!;
                
                const oldWinnerStats = { points: 2, played: 1, won: 1, lost: 0, setsFor: oldWinnerId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon, setsAgainst: oldWinnerId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon, gamesFor: oldWinnerId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon, gamesAgainst: oldWinnerId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon };
                const oldLoserStats = { points: 0, played: 1, won: 0, lost: 1, setsFor: oldLoserId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon, setsAgainst: oldLoserId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon, gamesFor: oldLoserId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon, gamesAgainst: oldLoserId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon };
                
                await updateStats(tx, oldWinnerId, oldWinnerStats, 'decrement');
                await updateStats(tx, oldLoserId, oldLoserStats, 'decrement');
            } else if (competition.format === CompetitionFormat.KNOCKOUT) {
                const winnerToRevert = match.winnerId!;
                const currentRoundNumber = match.roundNumber;
                
                const nextRoundMatches = await tx.match.findMany({ where: { competitionId: params.competitionId, roundNumber: currentRoundNumber + 1 }, orderBy: { id: 'asc' } });
                
                if (nextRoundMatches.length > 0) {
                    const currentRoundMatches = await tx.match.findMany({ where: { competitionId: params.competitionId, roundNumber: currentRoundNumber }, orderBy: { id: 'asc' } });
                    const matchIndex = currentRoundMatches.findIndex(m => m.id === params.matchId);
                    const nextMatchIndex = Math.floor(matchIndex / 2);
                    const nextMatch = nextRoundMatches[nextMatchIndex];
                    
                    if (nextMatch) {
                        const updateData = nextMatch.team1Id === winnerToRevert ? { team1Id: null } : { team2Id: null };
                        await tx.match.update({ where: { id: nextMatch.id }, data: updateData });
                    }
                }
            }

            await tx.match.update({ where: { id: params.matchId }, data: { result: null, winnerId: null } });
        });

        return NextResponse.json({ message: "Resultado eliminado con éxito." });
    } catch (error) {
        console.error("[MATCH_DELETE_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}