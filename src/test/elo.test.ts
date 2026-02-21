import { describe, it, expect } from 'vitest'
import {
  getExpectedScore,
  getKFactor,
  calculateNewRatings,
  calculateTeamRating,
  calculateMatchRatings,
  DEFAULT_RATING,
} from '@/lib/elo'

describe('getExpectedScore', () => {
  it('retorna 0.5 para ratings iguales', () => {
    expect(getExpectedScore(1500, 1500)).toBe(0.5)
  })

  it('retorna > 0.5 para rating superior', () => {
    const score = getExpectedScore(1600, 1400)
    expect(score).toBeGreaterThan(0.5)
    expect(score).toBeLessThan(1)
  })

  it('retorna < 0.5 para rating inferior', () => {
    const score = getExpectedScore(1400, 1600)
    expect(score).toBeLessThan(0.5)
    expect(score).toBeGreaterThan(0)
  })

  it('las probabilidades de ambos jugadores suman 1', () => {
    const scoreA = getExpectedScore(1600, 1400)
    const scoreB = getExpectedScore(1400, 1600)
    expect(scoreA + scoreB).toBeCloseTo(1)
  })

  it('diferencia de 400 puntos da ~0.91 para el favorito', () => {
    const score = getExpectedScore(1700, 1300)
    expect(score).toBeCloseTo(0.909, 2)
  })
})

describe('getKFactor', () => {
  it('retorna 32 para jugadores nuevos (<30 partidos)', () => {
    expect(getKFactor(0)).toBe(32)
    expect(getKFactor(15)).toBe(32)
    expect(getKFactor(29)).toBe(32)
  })

  it('retorna 24 para jugadores intermedios (30-99 partidos)', () => {
    expect(getKFactor(30)).toBe(24)
    expect(getKFactor(50)).toBe(24)
    expect(getKFactor(99)).toBe(24)
  })

  it('retorna 16 para jugadores experimentados (100+ partidos)', () => {
    expect(getKFactor(100)).toBe(16)
    expect(getKFactor(500)).toBe(16)
  })
})

describe('calculateNewRatings', () => {
  it('ratings iguales, A gana: A sube y B baja', () => {
    const result = calculateNewRatings({
      ratingA: 1500,
      ratingB: 1500,
      scoreA: 1,
      scoreB: 0,
      gamesPlayedA: 0,
      gamesPlayedB: 0,
    })

    expect(result.newRatingA).toBeGreaterThan(1500)
    expect(result.newRatingB).toBeLessThan(1500)
  })

  it('el cambio es simetrico cuando ambos tienen el mismo K', () => {
    const result = calculateNewRatings({
      ratingA: 1500,
      ratingB: 1500,
      scoreA: 1,
      scoreB: 0,
      gamesPlayedA: 10,
      gamesPlayedB: 10,
    })

    const changeA = result.newRatingA - 1500
    const changeB = 1500 - result.newRatingB
    expect(changeA).toBe(changeB)
  })

  it('upset (inferior gana) produce cambio grande', () => {
    const upset = calculateNewRatings({
      ratingA: 1300,
      ratingB: 1700,
      scoreA: 1,
      scoreB: 0,
      gamesPlayedA: 10,
      gamesPlayedB: 10,
    })

    const normal = calculateNewRatings({
      ratingA: 1700,
      ratingB: 1300,
      scoreA: 1,
      scoreB: 0,
      gamesPlayedA: 10,
      gamesPlayedB: 10,
    })

    const upsetChange = upset.newRatingA - 1300
    const normalChange = normal.newRatingA - 1700
    expect(upsetChange).toBeGreaterThan(normalChange)
  })

  it('favorito gana produce cambio pequeno', () => {
    const result = calculateNewRatings({
      ratingA: 1800,
      ratingB: 1200,
      scoreA: 1,
      scoreB: 0,
      gamesPlayedA: 10,
      gamesPlayedB: 10,
    })

    const change = result.newRatingA - 1800
    // Con K=32 y rating muy superior, el cambio debe ser pequeno
    expect(change).toBeLessThan(5)
    expect(change).toBeGreaterThan(0)
  })

  it('K-factor diferente produce cambios asimetricos', () => {
    const result = calculateNewRatings({
      ratingA: 1500,
      ratingB: 1500,
      scoreA: 1,
      scoreB: 0,
      gamesPlayedA: 10,  // K=32
      gamesPlayedB: 150, // K=16
    })

    const changeA = result.newRatingA - 1500
    const changeB = 1500 - result.newRatingB
    expect(changeA).toBeGreaterThan(changeB)
  })
})

describe('calculateTeamRating', () => {
  it('calcula el promedio de dos jugadores', () => {
    expect(calculateTeamRating(1400, 1600)).toBe(1500)
  })

  it('maneja ratings iguales', () => {
    expect(calculateTeamRating(1500, 1500)).toBe(1500)
  })
})

describe('calculateMatchRatings', () => {
  it('equipo ganador sube, equipo perdedor baja', () => {
    const result = calculateMatchRatings({
      team1Ratings: [1500, 1500],
      team2Ratings: [1500, 1500],
      winner: 1,
      gamesPlayedTeam1: [10, 10],
      gamesPlayedTeam2: [10, 10],
    })

    // Ambos del equipo 1 suben
    expect(result.newTeam1Ratings[0]).toBeGreaterThan(1500)
    expect(result.newTeam1Ratings[1]).toBeGreaterThan(1500)
    // Ambos del equipo 2 bajan
    expect(result.newTeam2Ratings[0]).toBeLessThan(1500)
    expect(result.newTeam2Ratings[1]).toBeLessThan(1500)
  })

  it('equipo 2 gana: equipo 2 sube, equipo 1 baja', () => {
    const result = calculateMatchRatings({
      team1Ratings: [1500, 1500],
      team2Ratings: [1500, 1500],
      winner: 2,
      gamesPlayedTeam1: [10, 10],
      gamesPlayedTeam2: [10, 10],
    })

    expect(result.newTeam1Ratings[0]).toBeLessThan(1500)
    expect(result.newTeam1Ratings[1]).toBeLessThan(1500)
    expect(result.newTeam2Ratings[0]).toBeGreaterThan(1500)
    expect(result.newTeam2Ratings[1]).toBeGreaterThan(1500)
  })

  it('jugadores de un mismo equipo con diferente experiencia tienen cambios diferentes', () => {
    const result = calculateMatchRatings({
      team1Ratings: [1500, 1500],
      team2Ratings: [1500, 1500],
      winner: 1,
      gamesPlayedTeam1: [5, 150],  // uno nuevo (K=32), uno experimentado (K=16)
      gamesPlayedTeam2: [50, 50],
    })

    const changeP1 = result.newTeam1Ratings[0] - 1500
    const changeP2 = result.newTeam1Ratings[1] - 1500
    // El jugador nuevo (K=32) tiene mayor cambio que el experimentado (K=16)
    expect(changeP1).toBeGreaterThan(changeP2)
  })

  it('el DEFAULT_RATING es 1500', () => {
    expect(DEFAULT_RATING).toBe(1500)
  })
})
