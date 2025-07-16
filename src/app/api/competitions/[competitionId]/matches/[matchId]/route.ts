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

// --- CORREGIDO Y MEJORADO: Función parseResult robusta ---
function parseResult(result: string | null | undefined) {
    if (!result) {
        return { team1SetsWon: 0, team2SetsWon: 0, team1GamesWon: 0, team2GamesWon: 0, sanitizedResult: "" };
    }

    // 1. Limpia y estandariza el string: reemplaza comas, elimina espacios extra.
    const sanitizedResult = result.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    const sets = sanitizedResult.split(' ');

    let team1SetsWon = 0, team2SetsWon = 0, team1GamesWon = 0, team2GamesWon = 0;

    for (const setStr of sets) {
        if (!setStr) continue; // Salta si hay sets vacíos por dobles espacios

        const games = setStr.split('-').map(s => parseInt(s.trim(), 10));

        // Asegura que el set sea válido (ej: "6-4" y no "6-" o "a-b")
        if (games.length !== 2 || isNaN(games[0]) || isNaN(games[1])) {
            continue;
        }

        const [team1Score, team2Score] = games;

        // 2. Suma los juegos como NÚMEROS
        team1GamesWon += team1Score;
        team2GamesWon += team2Score;

        if (team1Score > team2Score) {
            team1SetsWon++;
        } else if (team2Score > team1Score) {
            team2SetsWon++;
        }
    }

    return { team1SetsWon, team2SetsWon, team1GamesWon, team2GamesWon, sanitizedResult };
}


// --- PATCH: Actualiza un partido ---
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

        const match = await db.match.findUnique({ where: { id: params.matchId } });
        const competition = await db.competition.findUnique({ where: { id: params.competitionId } });

        if (!match || !competition) { return new NextResponse("Partido o competición no encontrados.", { status: 404 }); }
        if (!match.team1Id || !match.team2Id) { return new NextResponse("Los equipos de este partido no están definidos.", { status: 400 }); }

        // --- Inicia la transacción ---
        return await db.$transaction(async (tx) => {
            // 1. Revertir estadísticas antiguas si existían
            if (match.result && match.winnerId) {
                const { sanitizedResult: _, ...oldStats } = parseResult(match.result);
                const oldWinnerId = match.winnerId;
                const oldLoserId = oldWinnerId === match.team1Id ? match.team2Id! : match.team1Id!;

                const oldWinnerStats = { points: 2, played: 1, won: 1, lost: 0, setsFor: oldWinnerId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon, setsAgainst: oldWinnerId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon, gamesFor: oldWinnerId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon, gamesAgainst: oldWinnerId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon };
                const oldLoserStats = { points: 1, played: 1, won: 0, lost: 1, setsFor: oldLoserId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon, setsAgainst: oldLoserId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon, gamesFor: oldLoserId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon, gamesAgainst: oldLoserId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon };

                await updateStats(tx, oldWinnerId, oldWinnerStats, 'decrement');
                await updateStats(tx, oldLoserId, oldLoserStats, 'decrement');
            }

            // 2. Calcular nuevas estadísticas
            const { sanitizedResult, ...newStats } = parseResult(newResult);
            const newWinnerId = newStats.team1SetsWon > newStats.team2SetsWon ? match.team1Id! : match.team2Id!;
            const newLoserId = newWinnerId === match.team1Id ? match.team2Id! : match.team1Id!;

            const newWinnerStats = { points: 2, played: 1, won: 1, lost: 0, setsFor: newWinnerId === match.team1Id ? newStats.team1SetsWon : newStats.team2SetsWon, setsAgainst: newWinnerId === match.team1Id ? newStats.team2SetsWon : newStats.team1SetsWon, gamesFor: newWinnerId === match.team1Id ? newStats.team1GamesWon : newStats.team2GamesWon, gamesAgainst: newWinnerId === match.team1Id ? newStats.team2GamesWon : newStats.team1GamesWon };
            const newLoserStats = { points: 1, played: 1, won: 0, lost: 1, setsFor: newLoserId === match.team1Id ? newStats.team1SetsWon : newStats.team2SetsWon, setsAgainst: newLoserId === match.team1Id ? newStats.team2SetsWon : newStats.team1SetsWon, gamesFor: newLoserId === match.team1Id ? newStats.team1GamesWon : newStats.team2GamesWon, gamesAgainst: newLoserId === match.team1Id ? newStats.team2GamesWon : newStats.team1GamesWon };

            await updateStats(tx, newWinnerId, newWinnerStats, 'increment');
            await updateStats(tx, newLoserId, newLoserStats, 'increment');

            // 3. Actualizar el partido con el resultado limpio y el ganador
            await tx.match.update({ where: { id: params.matchId }, data: { result: sanitizedResult, winnerId: newWinnerId } });

            // Si es un torneo, avanzar al ganador
            if (competition.format === CompetitionFormat.KNOCKOUT) {
                const currentRoundMatches = await tx.match.findMany({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber }, orderBy: { id: 'asc' } });
                const isFinal = (await tx.match.count({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber + 1 } })) === 0;

                if (!isFinal) {
                    const matchIndex = currentRoundMatches.findIndex(m => m.id === params.matchId);
                    const nextMatchIndex = Math.floor(matchIndex / 2);
                    const nextRoundMatches = await tx.match.findMany({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber + 1 }, orderBy: { id: 'asc' } });
                    const nextMatch = nextRoundMatches[nextMatchIndex];
                    if (nextMatch) {
                        const updateData = matchIndex % 2 === 0 ? { team1Id: newWinnerId } : { team2Id: newWinnerId };
                        await tx.match.update({ where: { id: nextMatch.id }, data: updateData });
                    }
                }
            }

            return NextResponse.json({ message: "Resultado guardado y estadísticas actualizadas." });
        });

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