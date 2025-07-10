import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// This API route handles submitting a match result

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
    const { result } = body; 

    if (!result) {
      return new NextResponse("Se requiere un resultado.", { status: 400 });
    }

    const match = await db.match.findUnique({
      where: { id: params.matchId },
      include: {
        team1: { select: { played: true } },
        team2: { select: { played: true } },
      }
    });

    if (!match) {
      return new NextResponse("Partido no encontrado.", { status: 404 });
    }

    // --- Result Parsing and Stats Calculation Logic ---
    const sets = result.split(' ').map((set: string) => set.split('-').map(Number));
    let team1SetsWon = 0;
    let team2SetsWon = 0;
    let team1GamesWon = 0;
    let team2GamesWon = 0;

    for (const set of sets) {
      team1GamesWon += set[0];
      team2GamesWon += set[1];
      if (set[0] > set[1]) {
        team1SetsWon++;
      } else {
        team2SetsWon++;
      }
    }

    const winnerId = team1SetsWon > team2SetsWon ? match.team1Id : match.team2Id;
    const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;

    // --- Database Transaction ---
    // This ensures all updates succeed or none do, maintaining data integrity.
    await db.$transaction([
      db.match.update({
        where: { id: params.matchId },
        data: { result, winnerId },
      }),
      // Update winner's stats (2 points for a win)
      db.team.update({
        where: { id: winnerId },
        data: {
          played: { increment: 1 },
          won: { increment: 1 },
          points: { increment: 2 }, 
          setsFor: { increment: winnerId === match.team1Id ? team1SetsWon : team2SetsWon },
          setsAgainst: { increment: winnerId === match.team1Id ? team2SetsWon : team1SetsWon },
          gamesFor: { increment: winnerId === match.team1Id ? team1GamesWon : team2GamesWon },
          gamesAgainst: { increment: winnerId === match.team1Id ? team2GamesWon : team1GamesWon },
        },
      }),
      // Update loser's stats (0 points for a loss)
      db.team.update({
        where: { id: loserId },
        data: {
          played: { increment: 1 },
          lost: { increment: 1 },
          points: { increment: 0 }, // CORRECTED: 0 points for a loss
          setsFor: { increment: loserId === match.team1Id ? team1SetsWon : team2SetsWon },
          setsAgainst: { increment: loserId === match.team1Id ? team2SetsWon : team1SetsWon },
          gamesFor: { increment: loserId === match.team1Id ? team1GamesWon : team2GamesWon },
          gamesAgainst: { increment: loserId === match.team1Id ? team2GamesWon : team1GamesWon },
        },
      }),
    ]);

    return NextResponse.json({ message: "Resultado guardado con éxito." });

  } catch (error) {
    console.error("[ADD_RESULT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}