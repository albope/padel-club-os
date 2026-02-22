import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { eloANivel } from "@/lib/elo";

// GET: Stats y posicion del jugador autenticado
export async function GET() {
  try {
    const auth = await requireAuth("competitions:read");
    if (isAuthError(auth)) return auth;

    const userId = auth.session.user.id;
    const clubId = auth.session.user.clubId;

    const stats = await db.playerStats.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });

    if (!stats || stats.matchesPlayed === 0) {
      return NextResponse.json({
        stats: {
          nivelPadel: 4.0,
          matchesPlayed: 0,
          matchesWon: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0,
          winStreak: 0,
          bestWinStreak: 0,
        },
        posicion: null,
        totalJugadores: 0,
      });
    }

    // Calcular posicion: cuantos tienen ELO mayor + 1
    const jugadoresConMasElo = await db.playerStats.count({
      where: {
        clubId,
        matchesPlayed: { gt: 0 },
        eloRating: { gt: stats.eloRating },
      },
    });

    const totalJugadores = await db.playerStats.count({
      where: { clubId, matchesPlayed: { gt: 0 } },
    });

    return NextResponse.json({
      stats: {
        nivelPadel: eloANivel(stats.eloRating),
        matchesPlayed: stats.matchesPlayed,
        matchesWon: stats.matchesWon,
        setsWon: stats.setsWon,
        setsLost: stats.setsLost,
        gamesWon: stats.gamesWon,
        gamesLost: stats.gamesLost,
        winStreak: stats.winStreak,
        bestWinStreak: stats.bestWinStreak,
      },
      posicion: jugadoresConMasElo + 1,
      totalJugadores,
    });
  } catch (error) {
    console.error("[GET_PLAYER_STATS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
