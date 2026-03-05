/**
 * Tests de integracion para el ciclo de vida de partidas abiertas (jugador):
 * POST (unirse), DELETE (salir), transiciones OPEN→FULL→OPEN, aislamiento club.
 * Complementa open-match-booking.test.ts (que cubre CRUD admin).
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearPartidaMock, crearSesionMock } from "@/test/factories"
import { crearRequest } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()
const mockCrearNotificacion = vi.fn().mockResolvedValue(undefined)

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: () => false,
}))
vi.mock("@/lib/validation", async () => {
  const actual = await vi.importActual("@/lib/validation")
  return actual
})
vi.mock("@/lib/notifications", () => ({
  crearNotificacion: (...args: unknown[]) => mockCrearNotificacion(...args),
}))
vi.mock("@prisma/client", () => ({
  OpenMatchStatus: { OPEN: "OPEN", FULL: "FULL", CONFIRMED: "CONFIRMED", CANCELLED: "CANCELLED" },
}))

import { POST, DELETE } from "@/app/api/player/open-matches/route"

// --- Helpers ---
const partidaOpen = (overrides: Record<string, unknown> = {}) => ({
  ...crearPartidaMock(),
  status: "OPEN",
  players: [
    { userId: "user-creator", openMatchId: "match-1" },
    { userId: "user-2", openMatchId: "match-1" },
    { userId: "user-3", openMatchId: "match-1" },
  ],
  ...overrides,
})

const partidaFull = (overrides: Record<string, unknown> = {}) => ({
  ...crearPartidaMock(),
  status: "FULL",
  players: [
    { userId: "user-creator", openMatchId: "match-1" },
    { userId: "user-1", openMatchId: "match-1" },
    { userId: "user-3", openMatchId: "match-1" },
    { userId: "user-4", openMatchId: "match-1" },
  ],
  ...overrides,
})

// =============================================================================
// POST: Unirse a partida abierta
// =============================================================================
describe("POST /api/player/open-matches (Unirse)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock()) // user-1, club-1
    mockDb.openMatch.findFirst.mockResolvedValue(partidaOpen())
    mockDb.openMatchPlayer.create.mockResolvedValue({})
    mockDb.openMatch.update.mockResolvedValue({})
    mockDb.user.findUnique.mockResolvedValue({ name: "Jugador Test" })
  })

  it("unirse exitosamente a partida OPEN", async () => {
    const response = await POST(crearRequest({
      body: { openMatchId: "match-1" },
    }))

    expect(response.status).toBe(200)
    expect(mockDb.$transaction).toHaveBeenCalled()
    expect(mockDb.openMatchPlayer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          openMatchId: "match-1",
          userId: "user-1",
        }),
      })
    )
  })

  it("transicion OPEN → FULL cuando se une el 4to jugador", async () => {
    // 3 jugadores existentes + user-1 = 4 → FULL
    mockDb.openMatch.findFirst.mockResolvedValue(partidaOpen({
      players: [
        { userId: "user-creator", openMatchId: "match-1" },
        { userId: "user-2", openMatchId: "match-1" },
        { userId: "user-3", openMatchId: "match-1" },
      ],
    }))

    await POST(crearRequest({ body: { openMatchId: "match-1" } }))

    expect(mockDb.openMatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "match-1" },
        data: expect.objectContaining({ status: "FULL" }),
      })
    )
  })

  it("NO transicion a FULL si < 4 jugadores tras unirse", async () => {
    // 1 jugador existente + user-1 = 2 → sigue OPEN
    mockDb.openMatch.findFirst.mockResolvedValue(partidaOpen({
      players: [
        { userId: "user-creator", openMatchId: "match-1" },
      ],
    }))

    await POST(crearRequest({ body: { openMatchId: "match-1" } }))

    expect(mockDb.openMatch.update).not.toHaveBeenCalled()
  })

  it("rechaza si partida esta FULL", async () => {
    mockDb.openMatch.findFirst.mockResolvedValue(partidaFull())

    const response = await POST(crearRequest({
      body: { openMatchId: "match-1" },
    }))

    expect(response.status).toBe(400)
  })

  it("rechaza si jugador ya esta en la partida (duplicado)", async () => {
    mockDb.openMatch.findFirst.mockResolvedValue(partidaOpen({
      players: [
        { userId: "user-1", openMatchId: "match-1" }, // user-1 ya esta
        { userId: "user-2", openMatchId: "match-1" },
      ],
    }))

    const response = await POST(crearRequest({
      body: { openMatchId: "match-1" },
    }))

    expect(response.status).toBe(409)
  })

  it("rechaza si partida no encontrada", async () => {
    mockDb.openMatch.findFirst.mockResolvedValue(null)

    const response = await POST(crearRequest({
      body: { openMatchId: "inexistente" },
    }))

    expect(response.status).toBe(404)
  })

  it("aislamiento: findFirst filtra por clubId del jugador", async () => {
    mockDb.openMatch.findFirst.mockResolvedValue(null)

    await POST(crearRequest({
      body: { openMatchId: "match-otro-club" },
    }))

    expect(mockDb.openMatch.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clubId: "club-1",
        }),
      })
    )
  })

  it("notifica al creador cuando alguien se une", async () => {
    await POST(crearRequest({ body: { openMatchId: "match-1" } }))

    expect(mockCrearNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "open_match_joined",
        userId: "user-creator",
      })
    )
  })

  it("notifica a todos cuando partida se llena (FULL)", async () => {
    mockDb.openMatch.findFirst.mockResolvedValue(partidaOpen({
      players: [
        { userId: "user-creator", openMatchId: "match-1" },
        { userId: "user-2", openMatchId: "match-1" },
        { userId: "user-3", openMatchId: "match-1" },
      ],
    }))

    await POST(crearRequest({ body: { openMatchId: "match-1" } }))

    // 3 notificaciones de FULL (una por cada jugador existente)
    const fullNotifications = mockCrearNotificacion.mock.calls.filter(
      (call) => call[0].tipo === "open_match_full"
    )
    expect(fullNotifications).toHaveLength(3)
  })

  it("validacion Zod: sin openMatchId → 400", async () => {
    const response = await POST(crearRequest({ body: {} }))
    expect(response.status).toBe(400)
  })
})

// =============================================================================
// DELETE: Salir de partida abierta
// =============================================================================
describe("DELETE /api/player/open-matches (Salir)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock()) // user-1
    mockDb.openMatch.findFirst.mockResolvedValue(partidaFull())
    mockDb.openMatchPlayer.delete.mockResolvedValue({})
    mockDb.openMatch.update.mockResolvedValue({})
  })

  it("salir de partida FULL → transicion a OPEN", async () => {
    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/open-matches?openMatchId=match-1",
    }))

    expect(response.status).toBe(200)
    expect(mockDb.$transaction).toHaveBeenCalled()
    expect(mockDb.openMatchPlayer.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          openMatchId_userId: { openMatchId: "match-1", userId: "user-1" },
        }),
      })
    )
    expect(mockDb.openMatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "OPEN" }),
      })
    )
  })

  it("salir de partida OPEN → NO cambia status", async () => {
    mockDb.openMatch.findFirst.mockResolvedValue(partidaOpen({
      players: [
        { userId: "user-1", openMatchId: "match-1" },
        { userId: "user-2", openMatchId: "match-1" },
      ],
    }))

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/open-matches?openMatchId=match-1",
    }))

    // openMatch.update no se llama porque ya estaba OPEN
    expect(mockDb.openMatch.update).not.toHaveBeenCalled()
  })

  it("rechaza si jugador no esta en la partida", async () => {
    mockDb.openMatch.findFirst.mockResolvedValue(partidaOpen({
      players: [
        { userId: "user-2", openMatchId: "match-1" },
        { userId: "user-3", openMatchId: "match-1" },
      ],
    }))

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/open-matches?openMatchId=match-1",
    }))

    expect(response.status).toBe(400)
  })

  it("rechaza si partida no encontrada", async () => {
    mockDb.openMatch.findFirst.mockResolvedValue(null)

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/open-matches?openMatchId=inexistente",
    }))

    expect(response.status).toBe(404)
  })

  it("sin openMatchId → 400", async () => {
    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/open-matches",
    }))

    expect(response.status).toBe(400)
  })

  it("aislamiento: findFirst filtra por clubId", async () => {
    mockDb.openMatch.findFirst.mockResolvedValue(null)

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/open-matches?openMatchId=match-otro-club",
    }))

    expect(mockDb.openMatch.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clubId: "club-1" }),
      })
    )
  })

  it("operacion atomica en $transaction", async () => {
    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/open-matches?openMatchId=match-1",
    }))

    expect(mockDb.$transaction).toHaveBeenCalled()
  })
})
