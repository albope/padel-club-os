// Algoritmo ELO para rankings de padel
// Basado en el sistema ELO estandar, adaptado para partidos de dobles

// Rating inicial por defecto
export const DEFAULT_RATING = 1500

// Factores K segun experiencia
const K_NEW = 32      // Menos de 30 partidos
const K_MEDIUM = 24   // 30-100 partidos
const K_EXPERIENCED = 16 // Mas de 100 partidos

/**
 * Calcula la probabilidad esperada de victoria de A contra B
 * Formula: 1 / (1 + 10^((ratingB - ratingA) / 400))
 */
export function getExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Determina el factor K segun el numero de partidos jugados
 * Jugadores nuevos tienen K alto (rating mas volatil)
 * Jugadores experimentados tienen K bajo (rating mas estable)
 */
export function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < 30) return K_NEW
  if (gamesPlayed < 100) return K_MEDIUM
  return K_EXPERIENCED
}

interface RatingParams {
  ratingA: number
  ratingB: number
  scoreA: number // 1 = victoria, 0 = derrota, 0.5 = empate
  scoreB: number
  gamesPlayedA: number
  gamesPlayedB: number
}

interface RatingResult {
  newRatingA: number
  newRatingB: number
}

/**
 * Calcula los nuevos ratings despues de un enfrentamiento individual
 * El sistema es zero-sum: lo que sube A, baja B (ajustado por K individual)
 */
export function calculateNewRatings(params: RatingParams): RatingResult {
  const { ratingA, ratingB, scoreA, scoreB, gamesPlayedA, gamesPlayedB } = params

  const expectedA = getExpectedScore(ratingA, ratingB)
  const expectedB = getExpectedScore(ratingB, ratingA)

  const kA = getKFactor(gamesPlayedA)
  const kB = getKFactor(gamesPlayedB)

  const newRatingA = Math.round(ratingA + kA * (scoreA - expectedA))
  const newRatingB = Math.round(ratingB + kB * (scoreB - expectedB))

  return { newRatingA, newRatingB }
}

/**
 * Calcula el rating promedio de un equipo de dobles
 */
export function calculateTeamRating(player1Rating: number, player2Rating: number): number {
  return (player1Rating + player2Rating) / 2
}

interface MatchRatingParams {
  team1Ratings: [number, number] // [jugador1, jugador2]
  team2Ratings: [number, number]
  winner: 1 | 2 // que equipo gano
  gamesPlayedTeam1: [number, number]
  gamesPlayedTeam2: [number, number]
}

interface MatchRatingResult {
  newTeam1Ratings: [number, number]
  newTeam2Ratings: [number, number]
}

/**
 * Calcula los nuevos ratings para un partido de dobles
 * Cada jugador se evalua contra el rating promedio del equipo contrario
 */
export function calculateMatchRatings(params: MatchRatingParams): MatchRatingResult {
  const { team1Ratings, team2Ratings, winner, gamesPlayedTeam1, gamesPlayedTeam2 } = params

  const team1Avg = calculateTeamRating(team1Ratings[0], team1Ratings[1])
  const team2Avg = calculateTeamRating(team2Ratings[0], team2Ratings[1])

  const scoreTeam1 = winner === 1 ? 1 : 0
  const scoreTeam2 = winner === 2 ? 1 : 0

  // Jugador 1 del equipo 1 vs promedio equipo 2
  const p1t1 = calculateNewRatings({
    ratingA: team1Ratings[0],
    ratingB: team2Avg,
    scoreA: scoreTeam1,
    scoreB: scoreTeam2,
    gamesPlayedA: gamesPlayedTeam1[0],
    gamesPlayedB: 0, // No aplica para el promedio
  })

  // Jugador 2 del equipo 1 vs promedio equipo 2
  const p2t1 = calculateNewRatings({
    ratingA: team1Ratings[1],
    ratingB: team2Avg,
    scoreA: scoreTeam1,
    scoreB: scoreTeam2,
    gamesPlayedA: gamesPlayedTeam1[1],
    gamesPlayedB: 0,
  })

  // Jugador 1 del equipo 2 vs promedio equipo 1
  const p1t2 = calculateNewRatings({
    ratingA: team2Ratings[0],
    ratingB: team1Avg,
    scoreA: scoreTeam2,
    scoreB: scoreTeam1,
    gamesPlayedA: gamesPlayedTeam2[0],
    gamesPlayedB: 0,
  })

  // Jugador 2 del equipo 2 vs promedio equipo 1
  const p2t2 = calculateNewRatings({
    ratingA: team2Ratings[1],
    ratingB: team1Avg,
    scoreA: scoreTeam2,
    scoreB: scoreTeam1,
    gamesPlayedA: gamesPlayedTeam2[1],
    gamesPlayedB: 0,
  })

  return {
    newTeam1Ratings: [p1t1.newRatingA, p2t1.newRatingA],
    newTeam2Ratings: [p1t2.newRatingA, p2t2.newRatingA],
  }
}
