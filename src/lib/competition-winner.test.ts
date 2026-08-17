import { describe, expect, it } from "vitest"
import { obtenerCampeonEliminatoria } from "@/lib/competition-winner"

const equipo = (name: string) => ({ name })

describe("obtenerCampeonEliminatoria", () => {
  it("devuelve el equipo ganador de la final", () => {
    const campeon = obtenerCampeonEliminatoria([
      {
        roundNumber: 1,
        winnerId: "equipo-1",
        team1Id: "equipo-1",
        team2Id: "equipo-2",
        team1: equipo("Las Bandejas"),
        team2: equipo("Los Globos"),
      },
      {
        roundNumber: 2,
        winnerId: "equipo-3",
        team1Id: "equipo-1",
        team2Id: "equipo-3",
        team1: equipo("Las Bandejas"),
        team2: equipo("Los Remates"),
      },
    ])

    expect(campeon).toEqual({ id: "equipo-3", name: "Los Remates" })
  })

  it("no anuncia campeón mientras la final no tiene ganador", () => {
    expect(obtenerCampeonEliminatoria([
      {
        roundNumber: 2,
        winnerId: null,
        team1Id: "equipo-1",
        team2Id: "equipo-3",
        team1: equipo("Las Bandejas"),
        team2: equipo("Los Remates"),
      },
    ])).toBeNull()
  })

  it("no infiere una final si la última ronda contiene varios partidos", () => {
    const semifinales = ["partido-1", "partido-2"].map((id, indice) => ({
      id,
      roundNumber: 2,
      winnerId: `equipo-${indice + 1}`,
      team1Id: `equipo-${indice + 1}`,
      team2Id: `rival-${indice + 1}`,
      team1: equipo(`Equipo ${indice + 1}`),
      team2: equipo(`Rival ${indice + 1}`),
    }))

    expect(obtenerCampeonEliminatoria(semifinales)).toBeNull()
  })
})
