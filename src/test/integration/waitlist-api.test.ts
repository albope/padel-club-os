import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearPistaMock, crearReservaMock, crearEntradaWaitlistMock, crearSesionMock, manana, ayer } from "@/test/factories"
import { crearRequest, crearParamsPlano, extraerJson } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: () => false,
}))
vi.mock("@/lib/validation", async () => {
  const actual = await vi.importActual("@/lib/validation")
  return actual
})
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { GET, POST } from "@/app/api/player/bookings/waitlist/route"
import { DELETE } from "@/app/api/player/bookings/waitlist/[id]/route"

describe("Waitlist API - GET (Listar entradas)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
  })

  it("lista entradas activas y notificadas futuras", async () => {
    const entradas = [
      crearEntradaWaitlistMock({ id: "wl-1", status: "active", startTime: manana(10, 0), endTime: manana(11, 30) }),
      crearEntradaWaitlistMock({ id: "wl-2", status: "notified", startTime: manana(14, 0), endTime: manana(15, 30) }),
    ]
    mockDb.bookingWaitlist.findMany.mockResolvedValue(entradas)

    const response = await GET()
    const data = await extraerJson(response) as Array<{ id: string; status: string }>

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(mockDb.bookingWaitlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["active", "notified"] },
          startTime: { gt: expect.any(Date) },
        }),
      })
    )
  })

  it("mapea campos correctamente (id, courtName, startTime ISO, status)", async () => {
    const entrada = crearEntradaWaitlistMock({
      id: "wl-map",
      startTime: manana(10, 0),
      endTime: manana(11, 30),
      status: "active",
    })
    mockDb.bookingWaitlist.findMany.mockResolvedValue([entrada])

    const response = await GET()
    const data = await extraerJson(response) as Array<Record<string, unknown>>

    expect(data[0]).toEqual(expect.objectContaining({
      id: "wl-map",
      courtName: "Pista 1",
      status: "active",
    }))
    expect(data[0].startTime).toBeDefined()
  })
})

describe("Waitlist API - POST (Apuntarse)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock()) // slot ocupado
    mockDb.bookingWaitlist.upsert.mockResolvedValue(crearEntradaWaitlistMock({ id: "wl-new" }))
  })

  it("apuntarse exitoso con upsert", async () => {
    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(201)
    expect(mockDb.bookingWaitlist.upsert).toHaveBeenCalled()
  })

  it("slot pasado rechaza 400", async () => {
    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: ayer(10, 0).toISOString(),
        endTime: ayer(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(400)
  })

  it("pista no pertenece al club rechaza 404", async () => {
    mockDb.court.findFirst.mockResolvedValue(null)

    const response = await POST(crearRequest({
      body: {
        courtId: "court-x",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(404)
  })

  it("slot disponible (no ocupado) rechaza 400", async () => {
    mockDb.booking.findFirst.mockResolvedValue(null) // slot libre

    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(400)
    const data = await extraerJson(response) as { error: string }
    expect(data.error).toContain("disponible")
  })

  it("upsert reactiva entrada previa con status active y notifiedAt null", async () => {
    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(mockDb.bookingWaitlist.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: "active",
          notifiedAt: null,
        }),
      })
    )
  })

  it("body invalido sin courtId rechaza 400", async () => {
    const response = await POST(crearRequest({
      body: {
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(400)
  })
})

describe("Waitlist API - DELETE (Salir)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
  })

  it("eliminar exitoso retorna 204", async () => {
    mockDb.bookingWaitlist.findFirst.mockResolvedValue(crearEntradaWaitlistMock())
    mockDb.bookingWaitlist.delete.mockResolvedValue({})

    const response = await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ id: "wl-1" })
    )

    expect(response.status).toBe(204)
    expect(mockDb.bookingWaitlist.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "wl-1" } })
    )
  })

  it("entrada no encontrada retorna 404", async () => {
    mockDb.bookingWaitlist.findFirst.mockResolvedValue(null)

    const response = await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ id: "wl-inexistente" })
    )

    expect(response.status).toBe(404)
  })

  it("entrada no pertenece al usuario retorna 404 (findFirst filtra userId)", async () => {
    mockDb.bookingWaitlist.findFirst.mockResolvedValue(null)

    const response = await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ id: "wl-otro-user" })
    )

    expect(response.status).toBe(404)
    expect(mockDb.bookingWaitlist.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
        }),
      })
    )
  })

  it("sin id rechaza 400", async () => {
    const response = await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ id: "" })
    )

    expect(response.status).toBe(400)
  })
})
