interface EquipoEnPartido {
  name: string
}

interface PartidoEliminatoria {
  roundNumber: number
  winnerId: string | null
  team1Id: string | null
  team2Id: string | null
  team1: EquipoEnPartido | null
  team2: EquipoEnPartido | null
}

export interface CampeonEliminatoria {
  id: string
  name: string
}

/**
 * Obtiene el ganador de la única final del cuadro. No infiere un campeón si el
 * cuadro está incompleto o si la última ronda contiene más de un partido.
 */
export function obtenerCampeonEliminatoria(
  partidos: PartidoEliminatoria[]
): CampeonEliminatoria | null {
  if (partidos.length === 0) return null

  const ultimaRonda = Math.max(...partidos.map((partido) => partido.roundNumber))
  const finales = partidos.filter((partido) => partido.roundNumber === ultimaRonda)

  const final = finales[0]
  if (finales.length !== 1 || !final?.winnerId) return null

  const winnerId = final.winnerId
  const equipoGanador = winnerId === final.team1Id
    ? final.team1
    : winnerId === final.team2Id
      ? final.team2
      : null

  if (!equipoGanador) return null

  return { id: winnerId, name: equipoGanador.name }
}
