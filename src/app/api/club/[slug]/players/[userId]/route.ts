import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { eloANivel } from "@/lib/elo"
import { logger } from "@/lib/logger"

// GET: Perfil publico de un jugador del club (requiere auth + mismo club)
export async function GET(
  req: Request,
  { params }: { params: { slug: string; userId: string } }
) {
  try {
    const auth = await requireAuth("players:read")
    if (isAuthError(auth)) return auth

    const club = await db.club.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    })

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado." }, { status: 404 })
    }

    // Solo miembros del mismo club pueden ver perfiles
    if (auth.session.user.clubId !== club.id) {
      return NextResponse.json({ error: "Sin acceso a este club." }, { status: 403 })
    }

    // Buscar jugador activo en este club
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
    })

    if (!jugador) {
      return NextResponse.json({ error: "Jugador no encontrado." }, { status: 404 })
    }

    const stats = jugador.playerStats[0]

    // Valoraciones recientes (ultimas 5)
    const valoraciones = await db.playerRating.findMany({
      where: { ratedId: params.userId, clubId: club.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        stars: true,
        comment: true,
        createdAt: true,
        rater: {
          select: { name: true },
        },
      },
    })

    // Partidas recientes (ultimas 5 jugadas: FULL/CONFIRMED, en el pasado)
    const ahora = new Date()
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
              select: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      id: jugador.id,
      nombre: jugador.name || "Sin nombre",
      imagen: jugador.image,
      nivel: jugador.level,
      posicion: jugador.position,
      nivelPadel: stats && stats.matchesPlayed > 0 ? eloANivel(stats.eloRating) : null,
      stats: {
        partidosJugados: stats?.matchesPlayed || 0,
        partidosGanados: stats?.matchesWon || 0,
        porcentajeVictorias: stats && stats.matchesPlayed > 0
          ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100)
          : 0,
        setsGanados: stats?.setsWon || 0,
        setsPerdidos: stats?.setsLost || 0,
        rachaActual: stats?.winStreak || 0,
        mejorRacha: stats?.bestWinStreak || 0,
        mediaEstrellas: stats?.averageRating || null,
        totalValoraciones: stats?.totalRatings || 0,
      },
      valoracionesRecientes: valoraciones.map((v) => ({
        stars: v.stars,
        comment: v.comment,
        raterName: v.rater.name || "Anonimo",
        createdAt: v.createdAt.toISOString(),
      })),
      partidasRecientes: partidasRecientes.map((p) => ({
        id: p.openMatch.id,
        matchTime: p.openMatch.matchTime.toISOString(),
        courtName: p.openMatch.court.name,
        companerosNombres: p.openMatch.players
          .filter((pl) => pl.user.name !== jugador.name)
          .map((pl) => pl.user.name || "Jugador"),
      })),
    })
  } catch (error) {
    logger.error("GET_PLAYER_PROFILE", "Error al obtener perfil de jugador", { slug: params.slug, userId: params.userId }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
