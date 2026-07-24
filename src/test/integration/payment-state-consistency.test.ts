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
const mockEnqueueRefund = vi.fn().mockResolvedValue({ status: "not_needed" })

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
vi.mock("@/lib/refunds", () => ({
  enqueueBookingRefund: (...args: unknown[]) => mockEnqueueRefund(...args),
}))
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

  it("con refund exitoso: delega en la cola duradera", async () => {
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
    mockEnqueueRefund.mockResolvedValue({ status: "succeeded" })

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    expect(mockEnqueueRefund).toHaveBeenCalledWith("booking-1", "Cancelado por el jugador")
    expect(mockStripeRefunds.create).not.toHaveBeenCalled()
    expect(mockAplicarRefundBooking).not.toHaveBeenCalled()
  })

  it("sin pago online: la cola decide que no necesita reembolso", async () => {
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

    expect(mockEnqueueRefund).toHaveBeenCalledWith("booking-1", "Cancelado por el jugador")
    expect(mockStripeRefunds.create).not.toHaveBeenCalled()
    expect(mockAplicarRefundBooking).not.toHaveBeenCalled()
  })

  it("si no se puede registrar la obligacion, la cancelacion sigue y queda pendiente", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "paid",
      paymentMethod: "online",
      startTime: manana(10, 0),
    }))
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_fail",
      status: "succeeded",
    }))
    mockEnqueueRefund.mockRejectedValue(new Error("Database unavailable"))

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.refundStatus).toBe("pending")
    expect(mockAplicarRefundBooking).not.toHaveBeenCalled()
    // Pero booking se cancelo
    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "cancelled" }),
      })
    )
  })

  it("Payment ya refunded: la cola devuelve already_refunded sin duplicar Stripe", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "paid",
      paymentMethod: "online",
      startTime: manana(10, 0),
    }))
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_done",
      status: "refunded",
    }))
    mockEnqueueRefund.mockResolvedValue({ status: "already_refunded" })

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    expect(mockEnqueueRefund).toHaveBeenCalled()
    expect(mockStripeRefunds.create).not.toHaveBeenCalled()
    expect(mockAplicarRefundBooking).not.toHaveBeenCalled()
  })
})
