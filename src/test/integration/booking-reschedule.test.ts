import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPistaMock, crearReservaMock, crearSesionMock, manana, ayer } from "@/test/factories"
import { crearRequest, crearParams, extraerJson } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()
const mockCalcPrecio = vi.fn().mockResolvedValue(25)
const mockCrearNotificacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailReagendamiento = vi.fn().mockResolvedValue(undefined)
const mockLiberarSlot = vi.fn().mockResolvedValue(undefined)
const mockLimpiarWaitlist = vi.fn().mockResolvedValue(undefined)

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
  calcularPrecioReserva: (...args: unknown[]) => mockCalcPrecio(...args),
}))
vi.mock("@/lib/notifications", () => ({
  crearNotificacion: (...args: unknown[]) => mockCrearNotificacion(...args),
}))
vi.mock("@/lib/email", () => ({
  enviarEmailReagendamientoReserva: (...args: unknown[]) => mockEnviarEmailReagendamiento(...args),
}))
vi.mock("@/lib/waitlist", () => ({
  liberarSlotYNotificar: (...args: unknown[]) => mockLiberarSlot(...args),
  limpiarWaitlistAlReservar: (...args: unknown[]) => mockLimpiarWaitlist(...args),
}))
vi.mock("@/lib/payment-sync", () => ({
  generarDatosPagoPorJugador: vi.fn().mockReturnValue([
    { bookingId: "booking-new", userId: "user-1", guestName: null, amount: 7, clubId: "club-1" },
    { bookingId: "booking-new", userId: null, guestName: "Jugador 2", amount: 6, clubId: "club-1" },
    { bookingId: "booking-new", userId: null, guestName: "Jugador 3", amount: 6, clubId: "club-1" },
    { bookingId: "booking-new", userId: null, guestName: "Jugador 4", amount: 6, clubId: "club-1" },
  ]),
}))
vi.mock("@/lib/stripe", () => ({
  stripe: { checkout: { sessions: { expire: vi.fn().mockResolvedValue({}) } }, refunds: { create: vi.fn().mockResolvedValue({}) } },
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { PATCH } from "@/app/api/player/bookings/[bookingId]/reschedule/route"

function llamarPATCH(body: Record<string, unknown>, bookingId = "booking-1") {
  return PATCH(
    crearRequest({ method: "PATCH", body }),
    crearParams({ bookingId })
  )
}

describe("Reagendamiento de reserva - PATCH", () => {
  const reservaOriginal = crearReservaMock({
    id: "booking-1",
    startTime: manana(10, 0),
    endTime: manana(11, 30),
    paymentStatus: "exempt",
    numPlayers: 4,
    court: { name: "Pista 1" },
  })

  const nuevaReserva = crearReservaMock({
    id: "booking-new",
    startTime: manana(14, 0),
    endTime: manana(15, 30),
    paymentStatus: "exempt",
  })

  function configurarMocksFindFirst() {
    mockDb.booking.findFirst.mockReset()
    mockDb.booking.findFirst
      .mockResolvedValueOnce(reservaOriginal) // findFirst para reserva original
      .mockResolvedValueOnce(null) // findFirst para overlap check
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    configurarMocksFindFirst()
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
    mockDb.booking.create.mockResolvedValue(nuevaReserva)
    mockDb.user.findUnique.mockResolvedValue({ email: "j@test.com", name: "J", club: { name: "C", slug: "c" } })
    mockDb.bookingPayment.createMany.mockResolvedValue({ count: 4 })

    // $transaction con array pattern
    mockDb.$transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === "function") return (input as (db: typeof mockDb) => Promise<unknown>)(mockDb)
      // Array pattern: retorna resultados en orden (update, create)
      return [crearReservaMock({ status: "cancelled" }), nuevaReserva]
    })
  })

  it("reagendamiento exitoso: $transaction con cancel + create", async () => {
    const response = await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(response.status).toBe(200)
    expect(mockDb.$transaction).toHaveBeenCalled()
  })

  it("reserva no encontrada retorna 404", async () => {
    mockDb.booking.findFirst.mockReset()
    mockDb.booking.findFirst.mockResolvedValue(null)

    const response = await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(response.status).toBe(404)
  })

  it("reserva pasada retorna 400", async () => {
    mockDb.booking.findFirst.mockReset()
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      startTime: ayer(10, 0),
      endTime: ayer(11, 30),
    }))

    const response = await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(response.status).toBe(400)
  })

  it("politica de cancelacion no cumplida retorna 400", async () => {
    // Reserva en 1 hora, cancellationHours = 2
    const enUnaHora = new Date()
    enUnaHora.setHours(enUnaHora.getHours() + 1)
    mockDb.booking.findFirst.mockReset()
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      startTime: enUnaHora,
      endTime: new Date(enUnaHora.getTime() + 90 * 60000),
    }))
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ cancellationHours: 2 }))

    const response = await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(response.status).toBe(400)
  })

  it("enablePlayerBooking false retorna 403", async () => {
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ enablePlayerBooking: false }))

    const response = await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(response.status).toBe(403)
  })

  it("nuevo horario en el pasado retorna 400", async () => {
    const response = await llamarPATCH({
      newStartTime: ayer(14, 0).toISOString(),
      newEndTime: ayer(15, 30).toISOString(),
    })

    expect(response.status).toBe(400)
  })

  it("nuevo horario excede maxAdvanceBooking retorna 400", async () => {
    const lejos = new Date()
    lejos.setDate(lejos.getDate() + 30)

    const response = await llamarPATCH({
      newStartTime: lejos.toISOString(),
      newEndTime: new Date(lejos.getTime() + 90 * 60000).toISOString(),
    })

    expect(response.status).toBe(400)
  })

  it("overlap en nuevo slot retorna 409", async () => {
    mockDb.booking.findFirst.mockReset()
    mockDb.booking.findFirst
      .mockResolvedValueOnce(reservaOriginal) // original encontrada
      .mockResolvedValueOnce(crearReservaMock()) // overlap en nuevo slot

    const response = await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(response.status).toBe(409)
  })

  it("pista destino no encontrada retorna 404", async () => {
    mockDb.court.findFirst.mockResolvedValue(null)

    const response = await llamarPATCH({
      newCourtId: "court-inexistente",
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(response.status).toBe(404)
  })

  it("recalcula precio para nuevo slot", async () => {
    await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(mockCalcPrecio).toHaveBeenCalled()
  })

  it("regenera BookingPayments si paymentMethod != exempt", async () => {
    const reservaOnline = crearReservaMock({
      paymentMethod: "online",
      paymentStatus: "pending",
      numPlayers: 4,
      totalPrice: 40,
      court: { name: "Pista 1" },
    })
    mockDb.booking.findFirst.mockReset()
    mockDb.booking.findFirst
      .mockResolvedValueOnce(reservaOnline)
      .mockResolvedValueOnce(null)

    const nuevaConPending = crearReservaMock({ id: "new-b", paymentMethod: "online", paymentStatus: "pending" })
    mockDb.booking.create.mockResolvedValue(nuevaConPending)

    await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(mockDb.bookingPayment.createMany).toHaveBeenCalled()
  })

  it("no regenera BookingPayments si exempt", async () => {
    await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(mockDb.bookingPayment.createMany).not.toHaveBeenCalled()
  })

  it("libera slot original con liberarSlotYNotificar", async () => {
    await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(mockLiberarSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        courtId: "court-1",
        clubId: "club-1",
      })
    )
  })

  it("limpia waitlist del nuevo slot", async () => {
    await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    expect(mockLimpiarWaitlist).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
      })
    )
  })

  it("conserva paymentMethod, paymentStatus y numPlayers del original", async () => {
    await llamarPATCH({
      newStartTime: manana(14, 0).toISOString(),
      newEndTime: manana(15, 30).toISOString(),
    })

    // Verificar que booking.create dentro del $transaction usa valores derivados del original
    expect(mockDb.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          numPlayers: 4,
          paymentMethod: "exempt",
          paymentStatus: "exempt",
        }),
      })
    )
  })
})
