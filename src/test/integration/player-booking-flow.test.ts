import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPistaMock, crearReservaMock, crearPagoMock, crearSesionMock, manana } from "@/test/factories"
import { crearRequest, extraerJson } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()
const mockCrearNotificacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailConfirmacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailCancelacion = vi.fn().mockResolvedValue(undefined)
const mockLimpiarWaitlist = vi.fn().mockResolvedValue(undefined)
const mockLiberarSlot = vi.fn().mockResolvedValue(undefined)
const mockStripeRefunds = { create: vi.fn().mockResolvedValue({}) }

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
vi.mock("@/lib/notifications", () => ({
  crearNotificacion: (...args: unknown[]) => mockCrearNotificacion(...args),
}))
vi.mock("@/lib/email", () => ({
  enviarEmailConfirmacionReserva: (...args: unknown[]) => mockEnviarEmailConfirmacion(...args),
  enviarEmailCancelacionReserva: (...args: unknown[]) => mockEnviarEmailCancelacion(...args),
}))
vi.mock("@/lib/waitlist", () => ({
  limpiarWaitlistAlReservar: (...args: unknown[]) => mockLimpiarWaitlist(...args),
  liberarSlotYNotificar: (...args: unknown[]) => mockLiberarSlot(...args),
}))
vi.mock("@/lib/stripe", () => ({
  stripe: { refunds: { create: (...args: unknown[]) => mockStripeRefunds.create(...args) } },
}))
vi.mock("@/lib/payment-sync", () => ({
  generarDatosPagoPorJugador: vi.fn().mockReturnValue([
    { bookingId: "new-booking", userId: "user-1", guestName: null, amount: 5, clubId: "club-1" },
    { bookingId: "new-booking", userId: null, guestName: "Jugador 2", amount: 5, clubId: "club-1" },
    { bookingId: "new-booking", userId: null, guestName: "Jugador 3", amount: 5, clubId: "club-1" },
    { bookingId: "new-booking", userId: null, guestName: "Jugador 4", amount: 5, clubId: "club-1" },
  ]),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { POST, DELETE } from "@/app/api/player/bookings/route"

describe("Flujo de reserva de jugador - POST (Creacion)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.findFirst.mockResolvedValue(null) // sin overlap
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.booking.create.mockResolvedValue(crearReservaMock({ id: "new-booking" }))
    mockDb.user.findUnique.mockResolvedValue({ email: "j@test.com", name: "J", club: { name: "C", slug: "c" } })
    mockDb.bookingPayment.createMany.mockResolvedValue({ count: 4 })
  })

  it("flujo completo: validacion + overlap + precio + booking + BookingPayments", async () => {
    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(201)
    expect(mockDb.booking.create).toHaveBeenCalled()
  })

  it("rechaza si club tiene enablePlayerBooking=false", async () => {
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ enablePlayerBooking: false }))

    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(403)
  })

  it("rechaza reserva en el pasado", async () => {
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)

    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: ayer.toISOString(),
        endTime: ayer.toISOString(),
      },
    }))

    expect(response.status).toBe(400)
  })

  it("rechaza si excede maxAdvanceBooking", async () => {
    const lejos = new Date()
    lejos.setDate(lejos.getDate() + 30) // 30 dias, max es 7

    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: lejos.toISOString(),
        endTime: new Date(lejos.getTime() + 90 * 60000).toISOString(),
      },
    }))

    expect(response.status).toBe(400)
  })

  it("rechaza si pista no pertenece al club", async () => {
    mockDb.court.findFirst.mockResolvedValue(null)

    const response = await POST(crearRequest({
      body: {
        courtId: "court-inexistente",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(404)
  })

  it("modo presential: paymentMethod presential, requiresPayment false", async () => {
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ bookingPaymentMode: "presential" }))

    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    const data = await extraerJson(response) as { requiresPayment: boolean }
    expect(response.status).toBe(201)
    expect(data.requiresPayment).toBe(false)
    expect(mockDb.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentMethod: "presential", paymentStatus: "pending" }),
      })
    )
  })

  it("modo online + stripeConnectOnboarded: paymentStatus pending, requiresPayment true", async () => {
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({
      bookingPaymentMode: "online",
      stripeConnectOnboarded: true,
    }))

    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    const data = await extraerJson(response) as { requiresPayment: boolean }
    expect(response.status).toBe(201)
    expect(data.requiresPayment).toBe(true)
    expect(mockDb.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentStatus: "pending" }),
      })
    )
  })

  it("modo both + payAtClub=true: paymentStatus pending, requiresPayment false", async () => {
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({
      bookingPaymentMode: "both",
      stripeConnectOnboarded: true,
    }))

    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        payAtClub: true,
      },
    }))

    const data = await extraerJson(response) as { requiresPayment: boolean }
    expect(response.status).toBe(201)
    expect(data.requiresPayment).toBe(false)
  })

  it("crea BookingPayments para 4 jugadores con reparto de precio", async () => {
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({
      bookingPaymentMode: "online",
      stripeConnectOnboarded: true,
    }))

    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(mockDb.bookingPayment.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: "user-1" }),
        ]),
      })
    )
    // Verificar que son 4 pagos
    const llamada = mockDb.bookingPayment.createMany.mock.calls[0][0]
    expect(llamada.data).toHaveLength(4)
  })

  it("no crea BookingPayments si totalPrice es 0", async () => {
    // Si el precio es 0, no se crean BookingPayments
    const { calcularPrecioReserva } = await import("@/lib/pricing")
    vi.mocked(calcularPrecioReserva).mockResolvedValueOnce(0)

    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(mockDb.bookingPayment.createMany).not.toHaveBeenCalled()
  })

  it("llama a limpiarWaitlistAlReservar tras crear reserva", async () => {
    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(mockLimpiarWaitlist).toHaveBeenCalledWith(
      expect.objectContaining({
        courtId: "court-1",
        userId: "user-1",
      })
    )
  })

  it("envia notificacion de confirmacion", async () => {
    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(mockCrearNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "booking_confirmed",
        userId: "user-1",
      })
    )
  })

  it("envia email solo si no requiere pago online", async () => {
    // presential = no requiere pago → envia email
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ bookingPaymentMode: "presential" }))

    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(mockEnviarEmailConfirmacion).toHaveBeenCalled()
  })

  it("rechaza body invalido sin courtId", async () => {
    const response = await POST(crearRequest({
      body: {
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(400)
  })
})

describe("Flujo de reserva de jugador - DELETE (Cancelacion)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.user.findUnique.mockResolvedValue({ email: "j@test.com", name: "J", club: { name: "C", slug: "c" } })
  })

  it("cancelacion exitosa: marca cancelled + motivo", async () => {
    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "cancelled",
          cancelReason: "Cancelado por el jugador",
        }),
      })
    )
  })

  it("rechaza sin bookingId en query params", async () => {
    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings",
    }))

    expect(response.status).toBe(400)
  })

  it("rechaza si reserva no encontrada", async () => {
    mockDb.booking.findFirst.mockResolvedValue(null)

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=inexistente",
    }))

    expect(response.status).toBe(404)
  })

  it("rechaza cancelacion de reserva pasada", async () => {
    const pasada = new Date()
    pasada.setDate(pasada.getDate() - 1)
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      startTime: pasada,
    }))

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(400)
  })

  it("rechaza dentro del periodo de cancelacion (cancellationHours)", async () => {
    // Reserva en 1 hora, cancellationHours = 2 → no puede cancelar
    const enUnaHora = new Date()
    enUnaHora.setHours(enUnaHora.getHours() + 1)
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({ startTime: enUnaHora }))
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ cancellationHours: 2 }))

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(400)
  })

  it("procesa reembolso si reserva pagada con Stripe", async () => {
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock())

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    expect(mockStripeRefunds.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: "pi_test_123",
        refund_application_fee: false,
      })
    )
    expect(mockDb.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "refunded" },
      })
    )
  })

  it("error en reembolso no bloquea cancelacion", async () => {
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock())
    mockStripeRefunds.create.mockRejectedValue(new Error("Stripe error"))

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    // La cancelacion sigue adelante
    expect(response.status).toBe(200)
    expect(mockDb.booking.update).toHaveBeenCalled()
  })

  it("llama a liberarSlotYNotificar al cancelar", async () => {
    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockLiberarSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        courtId: "court-1",
        clubId: "club-1",
      })
    )
  })
})
