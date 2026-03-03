import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eloANivel } from "@/lib/elo";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Trophy, Target, Flame, Award, Swords } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EstrellasDisplay } from "@/components/social/EstrellasDisplay";

export const revalidate = 300;

export default async function PlayerProfilePage({
  params,
}: {
  params: { slug: string; userId: string };
}) {
  const t = await getTranslations("social");
  const locale = await getLocale();
  const localeCode = locale === "es" ? "es-ES" : "en-GB";
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

  // Buscar jugador activo
  const jugador = await db.user.findFirst({
    where: {
      id: params.userId,
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
          setsWon: true,
          setsLost: true,
          gamesWon: true,
          gamesLost: true,
          winStreak: true,
          bestWinStreak: true,
          averageRating: true,
          totalRatings: true,
        },
      },
    },
  });

  if (!jugador) notFound();

  const stats = jugador.playerStats[0];
  const nivelPadel =
    stats && stats.matchesPlayed > 0 ? eloANivel(stats.eloRating) : null;

  // Valoraciones recientes
  const valoraciones = await db.playerRating.findMany({
    where: { ratedId: params.userId, clubId: club.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      stars: true,
      comment: true,
      createdAt: true,
      rater: { select: { name: true } },
    },
  });

  // Partidas recientes
  const ahora = new Date();
  const partidasRecientes = await db.openMatchPlayer.findMany({
    where: {
      userId: params.userId,
      openMatch: {
        clubId: club.id,
        status: { in: ["FULL", "CONFIRMED"] },
        matchTime: { lt: ahora },
      },
    },
    orderBy: { openMatch: { matchTime: "desc" } },
    take: 5,
    select: {
      openMatch: {
        select: {
          id: true,
          matchTime: true,
          court: { select: { name: true } },
          players: {
            select: { user: { select: { name: true } } },
          },
        },
      },
    },
  });

  const nombre = jugador.name || "Sin nombre";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/club/${params.slug}/jugadores`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("backToPlayers")}
        </Link>
      </Button>

      {/* Header del perfil */}
      <div className="flex items-center gap-4">
        {jugador.image ? (
          <Image
            src={jugador.image}
            alt={nombre}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
            {nombre.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{nombre}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {nivelPadel !== null && (
              <Badge variant="default">ELO {nivelPadel.toFixed(1)}</Badge>
            )}
            {jugador.level && (
              <Badge variant="secondary">{jugador.level}</Badge>
            )}
            {jugador.position && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {jugador.position}
              </span>
            )}
          </div>
          {stats?.averageRating && (
            <div className="mt-2">
              <EstrellasDisplay
                valor={stats.averageRating}
                total={stats.totalRatings}
                size="md"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">{t("matches")}</span>
            </div>
            <p className="text-2xl font-bold">{stats?.matchesPlayed || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-medium">{t("winRate")}</span>
            </div>
            <p className="text-2xl font-bold">
              {stats && stats.matchesPlayed > 0
                ? `${Math.round((stats.matchesWon / stats.matchesPlayed) * 100)}%`
                : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Swords className="h-4 w-4" />
              <span className="text-xs font-medium">Sets</span>
            </div>
            <p className="text-2xl font-bold">
              {stats ? `${stats.setsWon}/${stats.setsLost}` : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-medium">{t("streak")}</span>
            </div>
            <p className="text-2xl font-bold">{stats?.winStreak || 0}</p>
            <p className="text-xs text-muted-foreground">
              {t("bestStreak")}: {stats?.bestWinStreak || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Partidas recientes */}
      {partidasRecientes.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold mb-3">{t("recentMatches")}</h2>
            <div className="space-y-2">
              {partidasRecientes.map((p) => (
                <div
                  key={p.openMatch.id}
                  className="flex items-center justify-between p-2 rounded-lg border text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{p.openMatch.court.name}</Badge>
                    <span>
                      {new Date(p.openMatch.matchTime).toLocaleDateString(
                        localeCode,
                        { day: "numeric", month: "short" }
                      )}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {p.openMatch.players
                      .filter((pl) => pl.user.name !== jugador.name)
                      .map((pl) => pl.user.name || "Jugador")
                      .join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Valoraciones recientes */}
      {valoraciones.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold mb-3">{t("recentRatings")}</h2>
            <div className="space-y-3">
              {valoraciones.map((v, i) => (
                <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between">
                    <EstrellasDisplay valor={v.stars} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.createdAt).toLocaleDateString(localeCode, {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  {v.comment && (
                    <p className="text-sm text-muted-foreground mt-1">
                      &quot;{v.comment}&quot;
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    — {v.rater.name || "Anonimo"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
