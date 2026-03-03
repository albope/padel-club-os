import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { logger } from "@/lib/logger"

// GET: Partidas pendientes de valorar (ultimos 7 dias)
export async function GET() {
  try {
    const auth = await requireAuth("ratings:write")
    if (isAuthError(auth)) return auth

    const userId = auth.session.user.id
    const clubId = auth.session.user.clubId

    const ahora = new Date()
    const hace30min = new Date(ahora.getTime() - 30 * 60 * 1000)
    const hace7dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Buscar partidas en las que participé, ya jugadas (hace >30min y <7 dias)
    const misPartidas = await db.openMatchPlayer.findMany({
      where: {
        userId,
        openMatch: {
          clubId,
          status: { in: ["FULL", "CONFIRMED"] },
          matchTime: {
            lt: hace30min,
            gt: hace7dias,
          },
        },
      },
      select: {
        openMatch: {
          select: {
            id: true,
            matchTime: true,
            court: { select: { name: true } },
            players: {
              select: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
        },
      },
      orderBy: { openMatch: { matchTime: "desc" } },
    })

    // Buscar las valoraciones que ya he dado
    const valoracionesDadas = await db.playerRating.findMany({
      where: {
        raterId: userId,
        clubId,
        openMatchId: { in: misPartidas.map((p) => p.openMatch.id) },
      },
      select: { ratedId: true, openMatchId: true },
    })

    // Set para lookup rapido
    const yaValorados = new Set(
      valoracionesDadas.map((v) => `${v.openMatchId}:${v.ratedId}`)
    )

    // Filtrar partidas con al menos un companero sin valorar
    const partidas = misPartidas
      .map((p) => {
        const companeros = p.openMatch.players
          .filter((pl) => pl.user.id !== userId)
          .map((pl) => ({
            userId: pl.user.id,
            nombre: pl.user.name || "Jugador",
            imagen: pl.user.image,
            yaValorado: yaValorados.has(`${p.openMatch.id}:${pl.user.id}`),
          }))

        const tienePendientes = companeros.some((c) => !c.yaValorado)
        if (!tienePendientes) return null

        return {
          openMatchId: p.openMatch.id,
          matchTime: p.openMatch.matchTime.toISOString(),
          courtName: p.openMatch.court.name,
          companeros,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ partidas })
  } catch (error) {
    logger.error("GET_PENDING_RATINGS", "Error al obtener valoraciones pendientes", {}, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
