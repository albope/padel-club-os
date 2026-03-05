/**
 * Tests de idempotencia y race conditions del webhook de Stripe.
 * Complementa stripe-webhook.test.ts (que cubre flujo feliz + auth).
 * Aqui: duplicados, booking eliminada, auto-refund, charge.refunded idempotente.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPagoMock, crearReservaMock } from "@/test/factories"

// --- Mocks ---
const mockConstructWebhookEvent = vi.fn()
const mockGetPlanKeyFromPriceId = vi.fn()
const mockCrearNotificacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailConfirmacion = vi.fn().mockResolvedValue(undefined)
const mockAsegurarBookingPayments = vi.fn().mockResolvedValue(4)
const mockStripeRefunds = { create: vi.fn().mockResolvedValue({}) }

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/stripe", () => ({
  constructWebhookEvent: (...args: unknown[]) => mockConstructWebhookEvent(...args),
  getPlanKeyFromPriceId: (...args: unknown[]) => mockGetPlanKeyFromPriceId(...args),
  stripe: { refunds: { create: (...args: unknown[]) => mockStripeRefunds.create(...args) } },
}))
vi.mock("@/lib/notifications", () => ({
  crearNotificacion: (...args: unknown[]) => mockCrearNotificacion(...args),
}))
vi.mock("@/lib/email", () => ({
  enviarEmailConfirmacionReserva: (...args: unknown[]) => mockEnviarEmailConfirmacion(...args),
}))
vi.mock("@/lib/payment-sync", () => ({
  asegurarBookingPayments: (...args: unknown[]) => mockAsegurarBookingPayments(...args),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { POST } from "@/app/api/stripe/webhook/route"

function crearWebhookRequest(body = "raw-body", signature = "sig_test") {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers: { "stripe-signature": signature },
  })
}

function crearEvento(type: string, data: unknown) {
  return { type, data: { object: data } }
}

describe("Webhook idempotencia - checkout.session.completed duplicado", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  })

  it("segundo envio del mismo evento no crea pago duplicado (payment ya existe)", async () => {
    const sessionData = {
      mode: "payment",
      metadata: { type: "booking_payment", bookingId: "b-1", clubId: "c-1", userId: "u-1" },
      amount_total: 4000,
      currency: "eur",
      payment_intent: "pi_dup",
    }
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", sessionData))

    // Primer envio: sin pago previo → crea pago
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 })
    mockDb.booking.findUnique.mockResolvedValue(crearReservaMock({
      paymentStatus: "paid",
      court: { name: "P1" },
      user: { email: "j@t.com", name: "J", club: { name: "C", slug: "c" } },
    }))
    mockDb.payment.create.mockResolvedValue(crearPagoMock())
    mockDb.bookingPayment.count.mockResolvedValue(4)
    mockDb.bookingPayment.updateMany.mockResolvedValue({ count: 4 })

    const resp1 = await POST(crearWebhookRequest())
    expect(resp1.status).toBe(200)
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1)

    vi.clearAllMocks()
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", sessionData))

    // Segundo envio: payment ya existe → skip
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({ stripePaymentId: "pi_dup" }))

    const resp2 = await POST(crearWebhookRequest())
    expect(resp2.status).toBe(200)
    // No debe iniciar transaccion
    expect(mockDb.$transaction).not.toHaveBeenCalled()
    // No debe crear pago duplicado
    expect(mockDb.payment.create).not.toHaveBeenCalled()
  })
})

describe("Webhook - auto-refund si booking fue cancelada", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  })

  it("emite refund automatico si booking.updateMany devuelve count=0 (cancelada)", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", {
      mode: "payment",
      metadata: { type: "booking_payment", bookingId: "b-cancelled", clubId: "c-1", userId: "u-1" },
      amount_total: 4000,
      payment_intent: "pi_to_refund",
    }))
    mockDb.payment.findUnique.mockResolvedValue(null)
    // Guard atomico: booking ya no esta "confirmed" → count=0
    mockDb.booking.updateMany.mockResolvedValue({ count: 0 })
    mockDb.booking.findUnique.mockResolvedValue(null) // $transaction devuelve null

    const response = await POST(crearWebhookRequest())

    expect(response.status).toBe(200)
    // Debe emitir refund
    expect(mockStripeRefunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_to_refund" })
    )
    // No debe crear Payment ni enviar notificacion
    expect(mockDb.payment.create).not.toHaveBeenCalled()
    expect(mockCrearNotificacion).not.toHaveBeenCalled()
    expect(mockEnviarEmailConfirmacion).not.toHaveBeenCalled()
  })

  it("auto-refund falla silenciosamente sin romper webhook response", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", {
      mode: "payment",
      metadata: { type: "booking_payment", bookingId: "b-cancelled", clubId: "c-1", userId: "u-1" },
      amount_total: 4000,
      payment_intent: "pi_refund_fail",
    }))
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.booking.updateMany.mockResolvedValue({ count: 0 })
    mockDb.booking.findUnique.mockResolvedValue(null)
    mockStripeRefunds.create.mockRejectedValue(new Error("Refund failed"))

    const response = await POST(crearWebhookRequest())
    // Webhook sigue respondiendo 200 (fire-and-forget)
    expect(response.status).toBe(200)
  })

  it("no emite refund si no hay payment_intent", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", {
      mode: "payment",
      metadata: { type: "booking_payment", bookingId: "b-cancelled", clubId: "c-1", userId: "u-1" },
      amount_total: 0,
      payment_intent: null,
    }))
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.booking.updateMany.mockResolvedValue({ count: 0 })
    mockDb.booking.findUnique.mockResolvedValue(null)

    await POST(crearWebhookRequest())

    expect(mockStripeRefunds.create).not.toHaveBeenCalled()
  })
})

describe("Webhook - charge.refunded idempotencia", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  })

  it("charge.refunded ya refunded → skip (no actualiza de nuevo)", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("charge.refunded", {
      payment_intent: "pi_already_refunded",
    }))
    mockDb.payment.findFirst.mockResolvedValue(
      crearPagoMock({ id: "pay-1", status: "refunded" })
    )

    const response = await POST(crearWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockDb.payment.update).not.toHaveBeenCalled()
  })

  it("charge.refunded sin payment en DB → skip", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("charge.refunded", {
      payment_intent: "pi_orphan",
    }))
    mockDb.payment.findFirst.mockResolvedValue(null)

    const response = await POST(crearWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockDb.payment.update).not.toHaveBeenCalled()
  })
})

describe("Webhook - BookingPayments marcados como paid en transaccion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  })

  it("asegurarBookingPayments + updateMany paid dentro de $transaction", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", {
      mode: "payment",
      metadata: { type: "booking_payment", bookingId: "b-1", clubId: "c-1", userId: "u-1" },
      amount_total: 4000,
      currency: "eur",
      payment_intent: "pi_test",
    }))
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 })
    mockDb.booking.findUnique.mockResolvedValue(crearReservaMock({
      court: { name: "P1" },
      user: { email: "j@t.com", name: "J", club: { name: "C", slug: "c" } },
    }))
    mockDb.payment.create.mockResolvedValue(crearPagoMock())
    mockDb.bookingPayment.updateMany.mockResolvedValue({ count: 4 })

    await POST(crearWebhookRequest())

    // asegurarBookingPayments se llama dentro de la transaccion
    expect(mockAsegurarBookingPayments).toHaveBeenCalledWith(
      expect.anything(), // tx (mockDb)
      "b-1"
    )
    // Todos los BookingPayments pending → paid
    expect(mockDb.bookingPayment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bookingId: "b-1", status: "pending" },
        data: expect.objectContaining({ status: "paid" }),
      })
    )
  })
})

describe("Webhook - customer.subscription.updated idempotencia", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  })

  it("subscription.updated repetido con mismo status no rompe", async () => {
    const subData = {
      id: "sub_1",
      metadata: { clubId: "c-1" },
      status: "active",
      items: { data: [{ price: { id: "price_pro" } }] },
    }
    mockConstructWebhookEvent.mockReturnValue(crearEvento("customer.subscription.updated", subData))
    mockGetPlanKeyFromPriceId.mockReturnValue("pro")
    mockDb.club.update.mockResolvedValue(crearClubMock())

    // Primer envio
    const resp1 = await POST(crearWebhookRequest())
    expect(resp1.status).toBe(200)

    vi.clearAllMocks()
    mockConstructWebhookEvent.mockReturnValue(crearEvento("customer.subscription.updated", subData))
    mockGetPlanKeyFromPriceId.mockReturnValue("pro")
    mockDb.club.update.mockResolvedValue(crearClubMock())

    // Segundo envio identico
    const resp2 = await POST(crearWebhookRequest())
    expect(resp2.status).toBe(200)
    // Actualiza de nuevo (es idempotente, mismos datos)
    expect(mockDb.club.update).toHaveBeenCalledTimes(1)
  })
})
