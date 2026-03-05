/**
 * Tests de integracion para consistencia de estados de pago.
 * Flujos criticos: cancel+refund, cancel sin pago, cron auto-cancel, reschedule.
 *
 * Tests unitarios de guards y payment-sync estan en src/lib/payment-states.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPagoMock, crearReservaMock, crearSesionMock, manana } from "@/test/factories"
import { crearRequest } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()
const mockCrearNotificacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailCancelacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailConfirmacion = vi.fn().mockResolvedValue(undefined)
const mockLiberarSlot = vi.fn().mockResolvedValue(undefined)
const mockLimpiarWaitlist = vi.fn().mockResolvedValue(undefined)
const mockStripeRefunds = { create: vi.fn().mockResolvedValue({}) }
const mockStripeCheckoutExpire = vi.fn().mockResolvedValue({})
const mockAplicarRefundBooking = vi.fn().mockResolvedValue(true)

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
  enviarEmailCancelacionReserva: (...args: unknown[]) => mockEnviarEmailCancelacion(...args),
  enviarEmailConfirmacionReserva: (...args: unknown[]) => mockEnviarEmailConfirmacion(...args),
}))
vi.mock("@/lib/waitlist", () => ({
  liberarSlotYNotificar: (...args: unknown[]) => mockLiberarSlot(...args),
  limpiarWaitlistAlReservar: (...args: unknown[]) => mockLimpiarWaitlist(...args),
}))
vi.mock("@/lib/stripe", () => ({
  stripe: {
    refunds: { create: (...args: unknown[]) => mockStripeRefunds.create(...args) },
    checkout: { sessions: { expire: (...args: unknown[]) => mockStripeCheckoutExpire(...args) } },
  },
}))
vi.mock("@/lib/payment-sync", async () => {
  const actual = await vi.importActual("@/lib/payment-sync")
  return {
    ...actual,
    generarDatosPagoPorJugador: vi.fn().mockReturnValue([
      { bookingId: "new-booking", userId: "user-1", guestName: null, amount: 5, clubId: "club-1" },
    ]),
    aplicarRefundBooking: (...args: unknown[]) => mockAplicarRefundBooking(...args),
  }
})
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { DELETE } from "@/app/api/player/bookings/route"

// =============================================================================
// Cancelacion jugador con refund: sincroniza Booking + BookingPayments
// =============================================================================
describe("Cancelacion jugador: sincronizacion de estados con refund", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ cancellationHours: 2 }))
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
    mockDb.user.findUnique.mockResolvedValue({ email: "j@t.com", name: "J", club: { name: "C", slug: "c" } })
  })

  it("con refund exitoso: llama aplicarRefundBooking en transaccion", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "paid",
      paymentMethod: "online",
      startTime: manana(10, 0),
    }))
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_123",
      status: "succeeded",
    }))
    mockDb.payment.update.mockResolvedValue({})

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    expect(mockStripeRefunds.create).toHaveBeenCalled()
    // aplicarRefundBooking llama dentro de $transaction
    expect(mockAplicarRefundBooking).toHaveBeenCalled()
  })

  it("sin pago online: NO llama aplicarRefundBooking (freeze)", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "pending",
      paymentMethod: "presential",
      startTime: manana(10, 0),
    }))
    mockDb.payment.findUnique.mockResolvedValue(null)

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockStripeRefunds.create).not.toHaveBeenCalled()
    expect(mockAplicarRefundBooking).not.toHaveBeenCalled()
  })

  it("refund falla en Stripe: no sincroniza pero cancelacion sigue OK", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "paid",
      paymentMethod: "online",
      startTime: manana(10, 0),
    }))
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_fail",
      status: "succeeded",
    }))
    mockStripeRefunds.create.mockRejectedValue(new Error("Stripe down"))

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    // Refund fallo -> no se llamo a la transaccion de sync
    expect(mockAplicarRefundBooking).not.toHaveBeenCalled()
    // Pero booking se cancelo
    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "cancelled" }),
      })
    )
  })

  it("Payment ya refunded: no intenta refund ni sync", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "paid",
      paymentMethod: "online",
      startTime: manana(10, 0),
    }))
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_done",
      status: "refunded",
    }))

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    expect(mockStripeRefunds.create).not.toHaveBeenCalled()
    expect(mockAplicarRefundBooking).not.toHaveBeenCalled()
  })
})
