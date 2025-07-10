// src/app/api/leagues/[leagueId]/matches/[matchId]/route.ts

import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Prisma } from '@prisma/client'; // Importar Prisma para tipos

// --- Helper Function to Update Stats (CORREGIDO) ---
// La función ya no es 'async'. Devuelve directamente la operación de Prisma (PrismaPromise).
function updateStats(
  teamId: string,
  stats: {
    points: number;
    played: number;
    won: number;
    lost: number;
    setsFor: number;
    setsAgainst: number;
    gamesFor: number;
    gamesAgainst: number;
  },
  operation: 'increment' | 'decrement'
) {
  // Ya no usamos 'async/await' aquí.
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

// --- Helper Function to Parse Result ---
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


// --- PATCH: Update or Edit a Match Result ---
export async function PATCH(
  req: Request,
  { params }: { params: { matchId: string } }
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

    const match = await db.match.findUnique({
      where: { id: params.matchId },
    });

    if (!match) {
      return new NextResponse("Partido no encontrado.", { status: 404 });
    }
    
    // El array ahora contendrá los tipos correctos (Prisma.Prisma__TeamClient)
    const transactionOperations = [];

    // --- Step 1: Revert old stats if a result already existed ---
    if (match.result && match.winnerId) {
      const oldStats = parseResult(match.result);
      const oldWinnerId = match.winnerId;
      const oldLoserId = oldWinnerId === match.team1Id ? match.team2Id : match.team1Id;
      
      const oldWinnerStats = {
        points: 2, played: 1, won: 1, lost: 0,
        setsFor: oldWinnerId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon,
        setsAgainst: oldWinnerId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon,
        gamesFor: oldWinnerId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon,
        gamesAgainst: oldWinnerId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon,
      };

      const oldLoserStats = {
        points: 0, played: 1, won: 0, lost: 1,
        setsFor: oldLoserId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon,
        setsAgainst: oldLoserId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon,
        gamesFor: oldLoserId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon,
        gamesAgainst: oldLoserId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon,
      };

      transactionOperations.push(updateStats(oldWinnerId, oldWinnerStats, 'decrement'));
      transactionOperations.push(updateStats(oldLoserId, oldLoserStats, 'decrement'));
    }

    // --- Step 2: Calculate and apply new stats ---
    const newStats = parseResult(newResult);
    const newWinnerId = newStats.team1SetsWon > newStats.team2SetsWon ? match.team1Id : match.team2Id;
    const newLoserId = newWinnerId === match.team1Id ? match.team2Id : match.team1Id;

    const newWinnerStats = {
        points: 2, played: 1, won: 1, lost: 0,
        setsFor: newWinnerId === match.team1Id ? newStats.team1SetsWon : newStats.team2SetsWon,
        setsAgainst: newWinnerId === match.team1Id ? newStats.team2SetsWon : newStats.team1SetsWon,
        gamesFor: newWinnerId === match.team1Id ? newStats.team1GamesWon : newStats.team2GamesWon,
        gamesAgainst: newWinnerId === match.team1Id ? newStats.team2GamesWon : newStats.team1GamesWon,
    };

    const newLoserStats = {
        points: 0, played: 1, won: 0, lost: 1,
        setsFor: newLoserId === match.team1Id ? newStats.team1SetsWon : newStats.team2SetsWon,
        setsAgainst: newLoserId === match.team1Id ? newStats.team2SetsWon : newStats.team1SetsWon,
        gamesFor: newLoserId === match.team1Id ? newStats.team1GamesWon : newStats.team2GamesWon,
        gamesAgainst: newLoserId === match.team1Id ? newStats.team2GamesWon : newStats.team1GamesWon,
    };
    
    transactionOperations.push(db.match.update({
        where: { id: params.matchId },
        data: { result: newResult, winnerId: newWinnerId },
    }));
    transactionOperations.push(updateStats(newWinnerId, newWinnerStats, 'increment'));
    transactionOperations.push(updateStats(newLoserId, newLoserStats, 'increment'));
    
    // --- Execute transaction ---
    // Ahora el array es del tipo correcto y la transacción funcionará.
    await db.$transaction(transactionOperations);

    return NextResponse.json({ message: "Resultado guardado con éxito." });

  } catch (error) {
    console.error("[MATCH_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}


// --- DELETE: Reset a Match Result ---
export async function DELETE(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const match = await db.match.findUnique({
      where: { id: params.matchId },
    });

    if (!match) {
      return new NextResponse("Partido no encontrado.", { status: 404 });
    }

    if (!match.result || !match.winnerId) {
      return NextResponse.json({ message: "El partido no tenía un resultado para eliminar." });
    }

    const transactionOperations = [];
    
    const oldStats = parseResult(match.result);
    const oldWinnerId = match.winnerId;
    const oldLoserId = oldWinnerId === match.team1Id ? match.team2Id : match.team1Id;

    const oldWinnerStats = {
      points: 2, played: 1, won: 1, lost: 0,
      setsFor: oldWinnerId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon,
      setsAgainst: oldWinnerId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon,
      gamesFor: oldWinnerId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon,
      gamesAgainst: oldWinnerId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon,
    };

    const oldLoserStats = {
      points: 0, played: 1, won: 0, lost: 1,
      setsFor: oldLoserId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon,
      setsAgainst: oldLoserId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon,
      gamesFor: oldLoserId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon,
      gamesAgainst: oldLoserId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon,
    };

    transactionOperations.push(updateStats(oldWinnerId, oldWinnerStats, 'decrement'));
    transactionOperations.push(updateStats(oldLoserId, oldLoserStats, 'decrement'));
    
    transactionOperations.push(db.match.update({
      where: { id: params.matchId },
      data: { result: null, winnerId: null },
    }));

    await db.$transaction(transactionOperations);

    return NextResponse.json({ message: "Resultado eliminado con éxito." });

  } catch (error) {
    console.error("[MATCH_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}