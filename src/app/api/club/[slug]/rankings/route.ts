import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { eloANivel } from "@/lib/elo";

// GET: Rankings publicos del club (sin auth)
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const club = await db.club.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Math.min(Math.max(1, limitParam), 100);

    const rankings = await db.playerStats.findMany({
      where: { clubId: club.id, matchesPlayed: { gt: 0 } },
      orderBy: { eloRating: "desc" },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, image: true, level: true },
        },
      },
    });

    const response = rankings.map((r, index) => ({
      posicion: index + 1,
      userId: r.userId,
      nombre: r.user.name || "Sin nombre",
      imagen: r.user.image,
      nivel: r.user.level,
      nivelPadel: eloANivel(r.eloRating),
      partidosJugados: r.matchesPlayed,
      partidosGanados: r.matchesWon,
      porcentajeVictorias: r.matchesPlayed > 0 ? Math.round((r.matchesWon / r.matchesPlayed) * 100) : 0,
      setsGanados: r.setsWon,
      setsPerdidos: r.setsLost,
      juegosGanados: r.gamesWon,
      juegosPerdidos: r.gamesLost,
      rachaActual: r.winStreak,
      mejorRacha: r.bestWinStreak,
    }));

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error("[GET_CLUB_RANKINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
