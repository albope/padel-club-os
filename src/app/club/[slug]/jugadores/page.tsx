import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eloANivel } from "@/lib/elo";
import { getTranslations } from "next-intl/server";
import JugadoresClient from "@/components/social/JugadoresClient";

export const revalidate = 300; // 5min

export default async function ClubJugadoresPage({ params }: { params: { slug: string } }) {
  const t = await getTranslations('social');
  const session = await getServerSession(authOptions);

  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });

  if (!club) notFound();

  // Solo miembros logueados del club pueden ver
  if (!session?.user || session.user.clubId !== club.id) {
    redirect(`/club/${params.slug}/login`);
  }

  const jugadores = await db.user.findMany({
    where: {
      clubId: club.id,
      role: "PLAYER",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      image: true,
      level: true,
      position: true,
      playerStats: {
        where: { clubId: club.id },
        select: {
          eloRating: true,
          matchesPlayed: true,
          matchesWon: true,
          averageRating: true,
          totalRatings: true,
        },
      },
    },
    orderBy: { name: "asc" },
    take: 12,
  });

  const total = await db.user.count({
    where: {
      clubId: club.id,
      role: "PLAYER",
      isActive: true,
    },
  });

  const data = jugadores.map((j) => {
    const stats = j.playerStats[0];
    return {
      id: j.id,
      nombre: j.name || "Sin nombre",
      imagen: j.image,
      nivel: j.level,
      posicion: j.position,
      nivelPadel: stats && stats.matchesPlayed > 0 ? eloANivel(stats.eloRating) : null,
      partidosJugados: stats?.matchesPlayed || 0,
      porcentajeVictorias: stats && stats.matchesPlayed > 0
        ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100)
        : 0,
      mediaEstrellas: stats?.averageRating || null,
      totalValoraciones: stats?.totalRatings || 0,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">{t('players')}</h1>
        <p className="text-muted-foreground mt-1">{t('playerDirectoryDesc')}</p>
        <div className="club-accent-line mt-3" />
      </div>
      <JugadoresClient
        initialJugadores={JSON.parse(JSON.stringify(data))}
        initialTotal={total}
        slug={params.slug}
      />
    </div>
  );
}
