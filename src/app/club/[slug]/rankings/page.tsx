import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { eloANivel } from "@/lib/elo";
import Leaderboard from "@/components/club/Leaderboard";

export const revalidate = 1800 // 30min

export default async function ClubRankingsPage({ params }: { params: { slug: string } }) {
  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });

  if (!club) notFound();

  const rankings = await db.playerStats.findMany({
    where: { clubId: club.id, matchesPlayed: { gt: 0 } },
    orderBy: { eloRating: "desc" },
    take: 50,
    include: {
      user: {
        select: { id: true, name: true, image: true, level: true },
      },
    },
  });

  const data = rankings.map((r, index) => ({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Rankings</h1>
        <p className="text-muted-foreground mt-1">Clasificación del club</p>
        <div className="club-accent-line mt-3" />
      </div>
      <Leaderboard rankings={JSON.parse(JSON.stringify(data))} slug={params.slug} />
    </div>
  );
}
