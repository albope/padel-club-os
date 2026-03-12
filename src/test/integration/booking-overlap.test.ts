import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPistaMock, crearReservaMock, crearSesionAdminMock, crearSesionMock, manana } from "@/test/factories"
import { crearRequest, crearParamsPlano, extraerJson } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()
vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: () => false,
}))
vi.mock("@/lib/pricing", () => ({
  calcularPrecioReserva: vi.fn().mockResolvedValue(20),
}))
vi.mock("@/lib/validation", async () => {
  const actual = await vi.importActual("@/lib/validation")
  return actual
})
vi.mock("@/lib/waitlist", () => ({
  limpiarWaitlistAlReservar: vi.fn().mockResolvedValue(undefined),
  liberarSlotYNotificar: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/notifications", () => ({
  crearNotificacion: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/email", () => ({
  enviarEmailConfirmacionReserva: vi.fn().mockResolvedValue(undefined),
  enviarEmailCancelacionReserva: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/stripe", () => ({
  stripe: { refunds: { create: vi.fn() } },
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))
vi.mock("@/lib/court-blocks", () => ({
  verificarBloqueo: vi.fn().mockResolvedValue(null),
}))

// Importar handlers DESPUES de los mocks
import { POST as adminBookingPOST } from "@/app/api/bookings/route"
import { PATCH as adminBookingPATCH } from "@/app/api/bookings/[bookingId]/route"
import { POST as playerBookingPOST } from "@/app/api/player/bookings/route"
import { POST as openMatchPOST } from "@/app/api/open-matches/route"

describe("Deteccion de solapamiento de reservas", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    // Default: pista existe
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    // Default: club existe
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    // Default: booking creado ok
    mockDb.booking.create.mockResolvedValue(crearReservaMock())
    // Default: usuario encontrado para emails
    mockDb.user.findUnique.mockResolvedValue({ email: "test@test.com", name: "Test", club: { name: "Club", slug: "club" } })
    mockDb.user.findMany.mockResolvedValue([{ id: "user-1" }, { id: "user-2" }])
  })

  it("rechaza dos reservas en la misma pista y mismo horario (admin)", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock()) // overlap encontrado

    const response = await adminBookingPOST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        userId: "user-1",
      },
    }))

    expect(response.status).toBe(409)
  })

  it("permite reservas adyacentes (10:00-11:00 + 11:00-12:00)", async () => {
    mockDb.booking.findFirst.mockResolvedValue(null) // sin overlap

    const response = await adminBookingPOST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(11, 0).toISOString(),
        endTime: manana(12, 0).toISOString(),
        userId: "user-1",
      },
    }))

    expect(response.status).toBe(201)
  })

  it("rechaza solapamiento parcial (10:00-11:30 vs 11:00-12:00)", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      startTime: manana(10, 0),
      endTime: manana(11, 30),
    }))

    const response = await adminBookingPOST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(11, 0).toISOString(),
        endTime: manana(12, 0).toISOString(),
        userId: "user-1",
      },
    }))

    expect(response.status).toBe(409)
  })

  it("reserva cancelada no bloquea solapamiento (player)", async () => {
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(null) // cancelled excluida del query

    const response = await playerBookingPOST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(201)
    // Verificar que el where excluye cancelled
    expect(mockDb.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: "cancelled" },
        }),
      })
    )
  })

  it("booking provisional (partida abierta) bloquea reserva regular", async () => {
    // Primero: crear partida que genera booking provisional
    // Para este test, verificamos que el overlap del player booking detecta provisionales
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({ status: "provisional" }))
    mockRequireAuth.mockResolvedValue(crearSesionMock())

    const response = await playerBookingPOST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(409)
  })

  it("permite reservas en pistas diferentes al mismo horario", async () => {
    mockDb.booking.findFirst.mockResolvedValue(null) // diferente pista = sin overlap

    const response = await adminBookingPOST(crearRequest({
      body: {
        courtId: "court-2",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        userId: "user-1",
      },
    }))

    expect(response.status).toBe(201)
  })

  it("PATCH admin excluye la propia reserva del overlap check", async () => {
    mockDb.booking.findFirst.mockResolvedValue(null) // sin overlap (excluye propia)
    mockDb.booking.update.mockResolvedValue(crearReservaMock())

    const response = await adminBookingPATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-1",
          startTime: manana(10, 0).toISOString(),
          endTime: manana(12, 0).toISOString(),
        },
      }),
      crearParamsPlano({ bookingId: "booking-1" })
    )

    expect(response.status).toBe(200)
    // Verificar que excluye la propia reserva
    expect(mockDb.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: "booking-1" },
        }),
      })
    )
  })
})
