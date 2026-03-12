import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPistaMock, crearPartidaMock, crearReservaMock, crearSesionAdminMock, manana } from "@/test/factories"
import { crearRequest, crearParamsPlano } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()
const mockLimpiarWaitlist = vi.fn().mockResolvedValue(undefined)
const mockLiberarSlot = vi.fn().mockResolvedValue(undefined)

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: () => false,
}))
vi.mock("@/lib/validation", async () => {
  const actual = await vi.importActual("@/lib/validation")
  return actual
})
vi.mock("@/lib/pricing", () => ({
  calcularPrecioReserva: vi.fn().mockResolvedValue(20),
}))
vi.mock("@/lib/waitlist", () => ({
  limpiarWaitlistAlReservar: (...args: unknown[]) => mockLimpiarWaitlist(...args),
  liberarSlotYNotificar: (...args: unknown[]) => mockLiberarSlot(...args),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))
vi.mock("@prisma/client", () => ({
  OpenMatchStatus: { OPEN: "OPEN", FULL: "FULL", CONFIRMED: "CONFIRMED", CANCELLED: "CANCELLED" },
}))
vi.mock("@/lib/court-blocks", () => ({
  verificarBloqueo: vi.fn().mockResolvedValue(null),
}))

import { POST } from "@/app/api/open-matches/route"
import { PATCH, DELETE } from "@/app/api/open-matches/[matchId]/route"

describe("Partidas abiertas - POST (Crear)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.findFirst.mockResolvedValue(null) // sin overlap
    mockDb.user.findMany.mockResolvedValue([{ id: "user-1" }, { id: "user-2" }])

    // $transaction callback: ejecuta la funcion con mockDb
    mockDb.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") return cb(mockDb)
      return Promise.all(cb as Promise<unknown>[])
    })
    mockDb.booking.create.mockResolvedValue({ id: "booking-prov" })
    mockDb.openMatch.create.mockResolvedValue({ id: "match-new", status: "OPEN" })
    mockDb.openMatchPlayer.createMany.mockResolvedValue({ count: 2 })
  })

  it("crear partida genera booking provisional + openMatch en $transaction", async () => {
    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        matchTime: manana(10, 0).toISOString(),
        playerIds: ["user-1", "user-2"],
      },
    }))

    expect(response.status).toBe(201)
    expect(mockDb.$transaction).toHaveBeenCalled()
    expect(mockDb.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "confirmed",
          paymentStatus: "exempt",
          paymentMethod: "exempt",
        }),
      })
    )
  })

  it("overlap check bloquea creacion si slot ocupado", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock())

    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        matchTime: manana(10, 0).toISOString(),
        playerIds: ["user-1", "user-2"],
      },
    }))

    expect(response.status).toBe(409)
  })

  it("4 jugadores genera openMatch con status FULL", async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }, { id: "u3" }, { id: "u4" }])

    await POST(crearRequest({
      body: {
        courtId: "court-1",
        matchTime: manana(10, 0).toISOString(),
        playerIds: ["u1", "u2", "u3", "u4"],
      },
    }))

    expect(mockDb.openMatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FULL",
        }),
      })
    )
  })

  it("2 jugadores genera openMatch con status OPEN", async () => {
    await POST(crearRequest({
      body: {
        courtId: "court-1",
        matchTime: manana(10, 0).toISOString(),
        playerIds: ["user-1", "user-2"],
      },
    }))

    expect(mockDb.openMatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "OPEN",
        }),
      })
    )
  })

  it("pista no pertenece al club rechaza 404", async () => {
    mockDb.court.findFirst.mockResolvedValue(null)

    const response = await POST(crearRequest({
      body: {
        courtId: "court-x",
        matchTime: manana(10, 0).toISOString(),
        playerIds: ["user-1"],
      },
    }))

    expect(response.status).toBe(404)
  })

  it("jugador no valido rechaza 400", async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: "user-1" }]) // solo 1 de 2

    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        matchTime: manana(10, 0).toISOString(),
        playerIds: ["user-1", "user-inexistente"],
      },
    }))

    expect(response.status).toBe(400)
  })

  it("llama limpiarWaitlistAlReservar al crear partida", async () => {
    await POST(crearRequest({
      body: {
        courtId: "court-1",
        matchTime: manana(10, 0).toISOString(),
        playerIds: ["user-1", "user-2"],
      },
    }))

    expect(mockLimpiarWaitlist).toHaveBeenCalledWith(
      expect.objectContaining({ courtId: "court-1" })
    )
  })
})

describe("Partidas abiertas - PATCH (Modificar)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())

    const partida = crearPartidaMock()
    mockDb.openMatch.findFirst.mockResolvedValue(partida)
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.findFirst.mockResolvedValue(null)
    mockDb.user.findMany.mockResolvedValue([{ id: "user-1" }, { id: "user-2" }])

    mockDb.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") return cb(mockDb)
      return Promise.all(cb as Promise<unknown>[])
    })
    mockDb.openMatch.update.mockResolvedValue({})
    mockDb.booking.update.mockResolvedValue({})
    mockDb.openMatchPlayer.deleteMany.mockResolvedValue({})
    mockDb.openMatchPlayer.createMany.mockResolvedValue({})
  })

  it("PATCH con cambio de slot llama liberar + limpiar waitlist", async () => {
    // Cambiar la pista (slot cambia)
    const response = await PATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-2", // diferente de court-1 original
          matchTime: manana(10, 0).toISOString(),
          playerIds: ["user-1", "user-2"],
        },
      }),
      crearParamsPlano({ matchId: "match-1" })
    )

    expect(response.status).toBe(200)
    expect(mockLiberarSlot).toHaveBeenCalled()
    expect(mockLimpiarWaitlist).toHaveBeenCalled()
  })

  it("PATCH sin cambio de slot no llama waitlist functions", async () => {
    // Mismo courtId y matchTime que el original
    const response = await PATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-1",
          matchTime: manana(10, 0).toISOString(),
          playerIds: ["user-1", "user-2"],
        },
      }),
      crearParamsPlano({ matchId: "match-1" })
    )

    expect(response.status).toBe(200)
    expect(mockLiberarSlot).not.toHaveBeenCalled()
    expect(mockLimpiarWaitlist).not.toHaveBeenCalled()
  })

  it("PATCH pista no encontrada rechaza 404", async () => {
    mockDb.court.findFirst.mockResolvedValue(null)

    const response = await PATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-x",
          matchTime: manana(10, 0).toISOString(),
          playerIds: ["user-1"],
        },
      }),
      crearParamsPlano({ matchId: "match-1" })
    )

    expect(response.status).toBe(404)
  })

  it("PATCH overlap en nuevo slot rechaza 409", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock()) // overlap

    const response = await PATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-1",
          matchTime: manana(14, 0).toISOString(),
          playerIds: ["user-1", "user-2"],
        },
      }),
      crearParamsPlano({ matchId: "match-1" })
    )

    expect(response.status).toBe(409)
  })
})

describe("Partidas abiertas - DELETE (Eliminar)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.openMatch.findFirst.mockResolvedValue(crearPartidaMock())
    mockDb.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") return cb(mockDb)
      return Promise.all(cb as Promise<unknown>[])
    })
    mockDb.openMatch.findUnique.mockResolvedValue({ bookingId: "booking-prov-1" })
    mockDb.openMatchPlayer.deleteMany.mockResolvedValue({})
    mockDb.openMatch.delete.mockResolvedValue({})
    mockDb.booking.delete.mockResolvedValue({})
  })

  it("eliminar borra players + match + booking provisional en $transaction", async () => {
    const response = await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ matchId: "match-1" })
    )

    expect(response.status).toBe(204)
    expect(mockDb.$transaction).toHaveBeenCalled()
    expect(mockDb.openMatchPlayer.deleteMany).toHaveBeenCalled()
    expect(mockDb.openMatch.delete).toHaveBeenCalled()
    expect(mockDb.booking.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "booking-prov-1" }),
      })
    )
  })

  it("[GAP] eliminar partida NO llama liberarSlotYNotificar (documenta gap funcional)", async () => {
    await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ matchId: "match-1" })
    )

    // Este test documenta un gap funcional:
    // Al eliminar una partida, se borra el booking provisional pero NO se notifica
    // a la lista de espera del slot liberado.
    // Si se corrige en el futuro, este test fallara y debera actualizarse.
    expect(mockLiberarSlot).not.toHaveBeenCalled()
  })
})
