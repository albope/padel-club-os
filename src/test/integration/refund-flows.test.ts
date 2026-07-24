/**
 * Tests de integracion para flujos de reembolso:
 * - Cancelacion jugador con pago online → refund Stripe
 * - Cancelacion jugador presential → sin refund
 * - Auto-cancel cron (sin pago) → no refund, expira checkout session
 * - Idempotencia de refund
 * - Error en refund no bloquea cancelacion
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPagoMock, crearReservaMock, crearSesionMock, manana } from "@/test/factories"
import { crearRequest, extraerJson } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()
const mockCrearNotificacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailCancelacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailConfirmacion = vi.fn().mockResolvedValue(undefined)
const mockLiberarSlot = vi.fn().mockResolvedValue(undefined)
const mockLimpiarWaitlist = vi.fn().mockResolvedValue(undefined)
const mockStripeRefunds = { create: vi.fn().mockResolvedValue({}) }
const mockStripeCheckoutExpire = vi.fn().mockResolvedValue({})
const mockEnqueueBookingRefund = vi.fn().mockResolvedValue({ status: "not_needed" })

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
vi.mock("@/lib/payment-sync", () => ({
  generarDatosPagoPorJugador: vi.fn().mockReturnValue([
    { bookingId: "new-booking", userId: "user-1", guestName: null, amount: 5, clubId: "club-1" },
    { bookingId: "new-booking", userId: null, guestName: "Jugador 2", amount: 5, clubId: "club-1" },
    { bookingId: "new-booking", userId: null, guestName: "Jugador 3", amount: 5, clubId: "club-1" },
    { bookingId: "new-booking", userId: null, guestName: "Jugador 4", amount: 5, clubId: "club-1" },
  ]),
}))
vi.mock("@/lib/refunds", () => ({
  enqueueBookingRefund: (...args: unknown[]) => mockEnqueueBookingRefund(...args),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { DELETE } from "@/app/api/player/bookings/route"

// =============================================================================
// Cancelacion jugador con pago online → refund
// =============================================================================
describe("Refund en cancelacion de jugador con pago online", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "paid",
      paymentMethod: "online",
      startTime: manana(10, 0),
    }))
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ cancellationHours: 2 }))
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_paid_123",
      status: "succeeded",
      amount: 20,
    }))
    mockDb.payment.update.mockResolvedValue({})
    mockDb.user.findUnique.mockResolvedValue({ email: "j@t.com", name: "J", club: { name: "C", slug: "c" } })
    mockEnqueueBookingRefund.mockResolvedValue({
      status: "succeeded",
      operationId: "refund-op-1",
    })
  })

  it("encola un refund durable para la reserva correcta", async () => {
    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    expect(mockEnqueueBookingRefund).toHaveBeenCalledWith(
      "booking-1",
      "Cancelado por el jugador",
    )
  })

  it("no marca el Payment antes de la confirmacion del worker", async () => {
    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockDb.payment.update).not.toHaveBeenCalled()
  })

  it("cancela booking ANTES de intentar refund (orden correcto)", async () => {
    const callOrder: string[] = []
    mockDb.booking.update.mockImplementation(async () => {
      callOrder.push("booking.update")
      return crearReservaMock({ status: "cancelled" })
    })
    mockDb.payment.findUnique.mockImplementation(async () => {
      callOrder.push("payment.findUnique")
      return crearPagoMock({ stripePaymentId: "pi_test", status: "succeeded" })
    })
    mockEnqueueBookingRefund.mockImplementation(async () => {
      callOrder.push("refund.enqueue")
      return { status: "succeeded", operationId: "refund-op-1" }
    })

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(callOrder.indexOf("booking.update")).toBeLessThan(
      callOrder.indexOf("refund.enqueue")
    )
  })
})

// =============================================================================
// Cancelacion jugador presential → sin refund
// =============================================================================
describe("Sin refund en cancelacion presential", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "pending",
      paymentMethod: "presential",
      startTime: manana(10, 0),
    }))
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
    mockDb.payment.findUnique.mockResolvedValue(null) // sin pago
    mockDb.user.findUnique.mockResolvedValue({ email: "j@t.com", name: "J", club: { name: "C", slug: "c" } })
  })

  it("no llama a Stripe refunds si no hay Payment", async () => {
    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockStripeRefunds.create).not.toHaveBeenCalled()
  })

  it("no llama a Stripe refunds si Payment.status != succeeded", async () => {
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_pending",
      status: "pending", // no succeeded
    }))

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockStripeRefunds.create).not.toHaveBeenCalled()
  })

  it("no llama a Stripe refunds si Payment sin stripePaymentId", async () => {
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: null,
      status: "succeeded",
    }))

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockStripeRefunds.create).not.toHaveBeenCalled()
  })
})

// =============================================================================
// Error en refund no bloquea cancelacion
// =============================================================================
describe("Refund error no bloquea cancelacion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "paid",
      paymentMethod: "online",
      startTime: manana(10, 0),
    }))
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
    mockDb.user.findUnique.mockResolvedValue({ email: "j@t.com", name: "J", club: { name: "C", slug: "c" } })
  })

  it("Stripe refund falla → cancelacion sigue exitosa", async () => {
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_fail",
      status: "succeeded",
    }))
    mockEnqueueBookingRefund.mockResolvedValue({
      status: "failed",
      operationId: "refund-op-failed",
    })

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    // Booking fue cancelada
    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "cancelled" }),
      })
    )
    // Payment NO se marco como refunded (porque fallo)
    expect(mockDb.payment.update).not.toHaveBeenCalled()
  })

  it("cancelacion envia notificacion y email incluso si refund falla", async () => {
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_fail",
      status: "succeeded",
    }))
    mockEnqueueBookingRefund.mockResolvedValue({
      status: "failed",
      operationId: "refund-op-failed",
    })

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockCrearNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "booking_cancelled" })
    )
    expect(mockEnviarEmailCancelacion).toHaveBeenCalled()
  })
})

// =============================================================================
// Expire checkout session al cancelar
// =============================================================================
describe("Expire checkout session al cancelar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.user.findUnique.mockResolvedValue({ email: "j@t.com", name: "J", club: { name: "C", slug: "c" } })
  })

  it("expira checkout session activa antes de cancelar", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      startTime: manana(10, 0),
      checkoutSessionId: "cs_active_123",
    }))

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockStripeCheckoutExpire).toHaveBeenCalledWith("cs_active_123")
  })

  it("no llama a expire si no hay checkoutSessionId", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      startTime: manana(10, 0),
      checkoutSessionId: null,
    }))

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockStripeCheckoutExpire).not.toHaveBeenCalled()
  })

  it("error en expire no bloquea cancelacion", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      startTime: manana(10, 0),
      checkoutSessionId: "cs_broken",
    }))
    mockStripeCheckoutExpire.mockRejectedValue(new Error("Already expired"))

    const response = await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(response.status).toBe(200)
    expect(mockDb.booking.update).toHaveBeenCalled()
  })

  it("limpia campos de checkout al cancelar (sessionId, expiresAt, lockUntil)", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      startTime: manana(10, 0),
      checkoutSessionId: "cs_123",
    }))

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checkoutSessionId: null,
          checkoutSessionExpiresAt: null,
          checkoutLockUntil: null,
        }),
      })
    )
  })
})

// =============================================================================
// Idempotencia: refund de booking ya refunded
// =============================================================================
describe("Idempotencia de refund", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "paid",
      paymentMethod: "online",
      startTime: manana(10, 0),
    }))
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
    mockDb.user.findUnique.mockResolvedValue({ email: "j@t.com", name: "J", club: { name: "C", slug: "c" } })
  })

  it("no intenta refund si Payment ya esta refunded", async () => {
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_already_refunded",
      status: "refunded",
    }))

    mockEnqueueBookingRefund.mockResolvedValue({ status: "already_refunded" })

    await DELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockEnqueueBookingRefund).toHaveBeenCalled()
    expect(mockStripeRefunds.create).not.toHaveBeenCalled()
  })
})
