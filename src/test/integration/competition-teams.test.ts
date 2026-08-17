import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearSesionAdminMock } from "@/test/factories"
import { crearParamsPlano, crearRequest, extraerJson } from "@/test/helpers/api-route"

const mockRequireAuth = vi.fn()

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: () => false,
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { POST } from "@/app/api/competitions/[competitionId]/teams/route"
import { PATCH } from "@/app/api/competitions/[competitionId]/teams/[teamId]/route"

const jugadores = [
  { userId: "jugador-1", user: { name: "Ana" } },
  { userId: "jugador-2", user: { name: "Luis" } },
]

describe("Equipos de competición", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.competition.findFirst.mockResolvedValue({ status: "ACTIVE" })
    mockDb.clubMembership.findMany.mockResolvedValue(jugadores)
    mockDb.team.findMany.mockResolvedValue([])
    mockDb.team.create.mockResolvedValue({ id: "equipo-nuevo" })
  })

  it("crea el equipo cuando ambos jugadores son miembros activos y están libres", async () => {
    const response = await POST(
      crearRequest({
        body: {
          name: "Los Globos",
          player1Id: "jugador-1",
          player2Id: "jugador-2",
        },
      }),
      crearParamsPlano({ competitionId: "competicion-1" })
    )

    expect(response.status).toBe(201)
    expect(mockDb.competition.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "competicion-1", clubId: "club-1" },
      })
    )
    expect(mockDb.team.create).toHaveBeenCalledWith({
      data: {
        name: "Los Globos",
        player1Id: "jugador-1",
        player2Id: "jugador-2",
        competitionId: "competicion-1",
      },
    })
  })

  it("explica qué jugador ya está inscrito y en qué equipo", async () => {
    mockDb.team.findMany.mockResolvedValue([
      {
        name: "Las Bandejas",
        player1Id: "jugador-1",
        player2Id: "otro-jugador",
      },
    ])

    const response = await POST(
      crearRequest({
        body: {
          name: "Los Globos",
          player1Id: "jugador-1",
          player2Id: "jugador-2",
        },
      }),
      crearParamsPlano({ competitionId: "competicion-1" })
    )
    const data = await extraerJson(response) as { error: string; codigo: string }

    expect(response.status).toBe(409)
    expect(data.codigo).toBe("JUGADOR_YA_INSCRITO")
    expect(data.error).toContain("Ana (Las Bandejas)")
    expect(data.error).toContain("Cada jugador solo puede pertenecer a un equipo")
    expect(mockDb.team.create).not.toHaveBeenCalled()
  })

  it("rechaza jugadores que no sean miembros activos del club", async () => {
    mockDb.clubMembership.findMany.mockResolvedValue([jugadores[0]])

    const response = await POST(
      crearRequest({
        body: {
          name: "Los Globos",
          player1Id: "jugador-1",
          player2Id: "jugador-externo",
        },
      }),
      crearParamsPlano({ competitionId: "competicion-1" })
    )
    const data = await extraerJson(response) as { error: string; codigo: string }

    expect(response.status).toBe(400)
    expect(data.codigo).toBe("JUGADOR_NO_PERTENECE_AL_CLUB")
    expect(data.error).toContain("miembros activos de este club")
    expect(mockDb.team.create).not.toHaveBeenCalled()
  })

  it("no permite crear equipos en una competición de otro club", async () => {
    mockDb.competition.findFirst.mockResolvedValue(null)

    const response = await POST(
      crearRequest({
        body: {
          name: "Los Globos",
          player1Id: "jugador-1",
          player2Id: "jugador-2",
        },
      }),
      crearParamsPlano({ competitionId: "competicion-externa" })
    )

    expect(response.status).toBe(404)
    expect(mockDb.team.create).not.toHaveBeenCalled()
  })

  it("al editar excluye el propio equipo pero detecta conflictos con otros", async () => {
    mockDb.team.findFirst.mockResolvedValue({
      player1Id: "jugador-1",
      player2Id: "jugador-2",
    })
    mockDb.team.findMany.mockResolvedValue([
      {
        name: "Las Voleas",
        player1Id: "jugador-2",
        player2Id: "otro-jugador",
      },
    ])

    const response = await PATCH(
      crearRequest({ method: "PATCH", body: { name: "Nombre actualizado" } }),
      crearParamsPlano({ competitionId: "competicion-1", teamId: "equipo-1" })
    )

    expect(response.status).toBe(409)
    expect(mockDb.team.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { not: "equipo-1" } }),
      })
    )
    expect(mockDb.team.update).not.toHaveBeenCalled()
  })
})
