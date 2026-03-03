import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { validarBody } from "@/lib/validation"
import { crearNotificacion } from "@/lib/notifications"
import { logger } from "@/lib/logger"
import * as z from "zod"

const CrearValoracionSchema = z.object({
  openMatchId: z.string().min(1, "openMatchId requerido"),
  ratedUserId: z.string().min(1, "ratedUserId requerido"),
  stars: z.number().int().min(1, "Minimo 1 estrella").max(5, "Maximo 5 estrellas"),
  comment: z.string().max(280, "Maximo 280 caracteres").optional(),
})

// POST: Crear valoracion post-partido
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("ratings:write")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const result = validarBody(CrearValoracionSchema, body)
    if (!result.success) return result.response

    const { openMatchId, ratedUserId, stars, comment } = result.data
    const raterId = auth.session.user.id
    const clubId = auth.session.user.clubId

    // No auto-valoracion
    if (raterId === ratedUserId) {
      return NextResponse.json({ error: "No puedes valorarte a ti mismo." }, { status: 400 })
    }

    // Verificar que la partida existe y pertenece al club
    const openMatch = await db.openMatch.findFirst({
      where: { id: openMatchId, clubId },
      include: {
        players: { select: { userId: true } },
      },
    })

    if (!openMatch) {
      return NextResponse.json({ error: "Partida no encontrada." }, { status: 404 })
    }

    // Verificar que ambos jugadores estaban en la partida
    const jugadoresEnPartida = openMatch.players.map((p) => p.userId)
    if (!jugadoresEnPartida.includes(raterId)) {
      return NextResponse.json({ error: "No participaste en esta partida." }, { status: 403 })
    }
    if (!jugadoresEnPartida.includes(ratedUserId)) {
      return NextResponse.json({ error: "El jugador valorado no participó en esta partida." }, { status: 400 })
    }

    // Verificar que la partida ya ocurrio
    if (openMatch.matchTime > new Date()) {
      return NextResponse.json({ error: "La partida aún no ha ocurrido." }, { status: 400 })
    }

    // Verificar que la partida esta en estado valido
    if (!["FULL", "CONFIRMED"].includes(openMatch.status)) {
      return NextResponse.json({ error: "Solo se pueden valorar partidas completadas." }, { status: 400 })
    }

    // Verificar duplicado
    const existente = await db.playerRating.findUnique({
      where: {
        raterId_ratedId_openMatchId: {
          raterId,
          ratedId: ratedUserId,
          openMatchId,
        },
      },
    })

    if (existente) {
      return NextResponse.json({ error: "Ya has valorado a este jugador en esta partida." }, { status: 409 })
    }

    // Crear valoracion y actualizar stats en transaccion
    await db.$transaction(async (tx) => {
      await tx.playerRating.create({
        data: {
          raterId,
          ratedId: ratedUserId,
          openMatchId,
          stars,
          comment: comment?.trim() || null,
          clubId,
        },
      })

      // Recalcular promedio de estrellas
      const agregado = await tx.playerRating.aggregate({
        where: { ratedId: ratedUserId, clubId },
        _avg: { stars: true },
        _count: { stars: true },
      })

      // Actualizar o crear PlayerStats con el promedio
      await tx.playerStats.upsert({
        where: { userId_clubId: { userId: ratedUserId, clubId } },
        update: {
          averageRating: agregado._avg.stars,
          totalRatings: agregado._count.stars,
        },
        create: {
          userId: ratedUserId,
          clubId,
          averageRating: agregado._avg.stars,
          totalRatings: agregado._count.stars,
        },
      })
    })

    // Notificar al jugador valorado (solo si >= 4 estrellas)
    if (stars >= 4) {
      const raterName = auth.session.user.name || "Un jugador"
      crearNotificacion({
        tipo: "player_rated",
        titulo: "Nueva valoracion",
        mensaje: `${raterName} te ha valorado con ${stars} estrellas.`,
        userId: ratedUserId,
        clubId,
        metadata: { openMatchId, stars, raterId },
      }).catch(() => {})
    }

    return NextResponse.json({ message: "Valoracion guardada." })
  } catch (error) {
    logger.error("POST_RATING", "Error al crear valoracion", {}, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
