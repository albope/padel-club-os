import { db } from "@/lib/db"

interface ValidarJugadoresEquipoParams {
  clubId: string
  competitionId: string
  playerIds: [string, string]
  teamIdExcluido?: string
}

type ResultadoValidacionJugadores =
  | { valido: true }
  | {
      valido: false
      status: 400 | 409
      codigo: "JUGADOR_NO_PERTENECE_AL_CLUB" | "JUGADOR_YA_INSCRITO"
      error: string
    }

/**
 * Comprueba que ambos jugadores son miembros activos del club y que cada uno
 * participa como maximo en un equipo de la competicion.
 */
export async function validarJugadoresEquipo({
  clubId,
  competitionId,
  playerIds,
  teamIdExcluido,
}: ValidarJugadoresEquipoParams): Promise<ResultadoValidacionJugadores> {
  const jugadoresIds = [...new Set(playerIds)]

  const [membresias, equiposExistentes] = await Promise.all([
    db.clubMembership.findMany({
      where: {
        clubId,
        userId: { in: jugadoresIds },
        status: "ACTIVE",
      },
      select: {
        userId: true,
        user: { select: { name: true } },
      },
    }),
    db.team.findMany({
      where: {
        competitionId,
        ...(teamIdExcluido ? { id: { not: teamIdExcluido } } : {}),
        OR: [
          { player1Id: { in: jugadoresIds } },
          { player2Id: { in: jugadoresIds } },
        ],
      },
      select: {
        name: true,
        player1Id: true,
        player2Id: true,
      },
    }),
  ])

  if (membresias.length !== jugadoresIds.length) {
    return {
      valido: false,
      status: 400,
      codigo: "JUGADOR_NO_PERTENECE_AL_CLUB",
      error: "Uno o ambos jugadores no son miembros activos de este club.",
    }
  }

  const nombrePorJugador = new Map(
    membresias.map((membresia) => [
      membresia.userId,
      membresia.user.name?.trim() || "Jugador sin nombre",
    ])
  )
  const conflictos = jugadoresIds.flatMap((playerId) => {
    const equipo = equiposExistentes.find(
      (existente) =>
        existente.player1Id === playerId || existente.player2Id === playerId
    )
    if (!equipo) return []
    return [`${nombrePorJugador.get(playerId)} (${equipo.name})`]
  })

  if (conflictos.length > 0) {
    return {
      valido: false,
      status: 409,
      codigo: "JUGADOR_YA_INSCRITO",
      error: `Ya inscrito en esta competición: ${conflictos.join(", ")}. Cada jugador solo puede pertenecer a un equipo.`,
    }
  }

  return { valido: true }
}
