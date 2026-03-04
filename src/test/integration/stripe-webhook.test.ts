import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPagoMock, crearReservaMock, crearUsuarioMock } from "@/test/factories"
import { extraerJson } from "@/test/helpers/api-route"

// --- Mocks ---
const mockConstructWebhookEvent = vi.fn()
const mockGetPlanKeyFromPriceId = vi.fn()
const mockCrearNotificacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailConfirmacion = vi.fn().mockResolvedValue(undefined)

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/stripe", () => ({
  constructWebhookEvent: (...args: unknown[]) => mockConstructWebhookEvent(...args),
  getPlanKeyFromPriceId: (...args: unknown[]) => mockGetPlanKeyFromPriceId(...args),
  stripe: { refunds: { create: vi.fn().mockResolvedValue({}) } },
}))
vi.mock("@/lib/notifications", () => ({
  crearNotificacion: (...args: unknown[]) => mockCrearNotificacion(...args),
}))
vi.mock("@/lib/email", () => ({
  enviarEmailConfirmacionReserva: (...args: unknown[]) => mockEnviarEmailConfirmacion(...args),
}))
vi.mock("@/lib/payment-sync", () => ({
  asegurarBookingPayments: vi.fn().mockResolvedValue(4),
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

describe("Stripe Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  })

  // --- Auth / Firma ---

  it("rechaza sin header stripe-signature", async () => {
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "test",
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it("rechaza con firma invalida", async () => {
    mockConstructWebhookEvent.mockImplementation(() => {
      throw new Error("Invalid signature")
    })

    const response = await POST(crearWebhookRequest())
    expect(response.status).toBe(400)
  })

  // --- checkout.session.completed (suscripcion) ---

  it("checkout.session.completed modo subscription actualiza club", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", {
      mode: "subscription",
      metadata: { clubId: "club-1" },
      subscription: "sub_test",
    }))

    const response = await POST(crearWebhookRequest())
    expect(response.status).toBe(200)
    expect(mockDb.club.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "club-1" },
        data: expect.objectContaining({
          stripeSubscriptionId: "sub_test",
          subscriptionStatus: "active",
        }),
      })
    )
  })

  // --- checkout.session.completed (booking payment) ---

  it("checkout.session.completed modo payment booking_payment crea payment y actualiza booking", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", {
      mode: "payment",
      metadata: { type: "booking_payment", bookingId: "booking-1", clubId: "club-1", userId: "user-1" },
      amount_total: 4000,
      currency: "eur",
      payment_intent: "pi_test",
    }))
    mockDb.payment.findUnique.mockResolvedValue(null) // sin pago previo
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 }) // guard atomico
    const updatedBooking = crearReservaMock({
      paymentStatus: "paid",
      court: { name: "Pista 1" },
      user: { email: "j@test.com", name: "J", club: { name: "C", slug: "c" } },
    })
    mockDb.booking.findUnique.mockResolvedValue(updatedBooking)
    mockDb.payment.create.mockResolvedValue(crearPagoMock())
    mockDb.bookingPayment.count.mockResolvedValue(4) // asegurarBookingPayments
    mockDb.bookingPayment.updateMany.mockResolvedValue({ count: 4 })

    const response = await POST(crearWebhookRequest())
    expect(response.status).toBe(200)
    expect(mockDb.$transaction).toHaveBeenCalled()
  })

  it("checkout.session.completed booking es idempotente si payment ya existe", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", {
      mode: "payment",
      metadata: { type: "booking_payment", bookingId: "booking-1", clubId: "club-1", userId: "user-1" },
      amount_total: 4000,
      payment_intent: "pi_test",
    }))
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock()) // ya existe

    const response = await POST(crearWebhookRequest())
    expect(response.status).toBe(200)
    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it("checkout.session.completed booking envia email y notificacion", async () => {
    const booking = crearReservaMock({
      paymentStatus: "paid",
      court: { name: "Pista 1" },
      user: { email: "j@test.com", name: "J", club: { name: "C", slug: "c" } },
    })
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", {
      mode: "payment",
      metadata: { type: "booking_payment", bookingId: "booking-1", clubId: "club-1", userId: "user-1" },
      amount_total: 4000,
      currency: "eur",
      payment_intent: "pi_test",
    }))
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 })
    mockDb.booking.findUnique.mockResolvedValue(booking)
    mockDb.payment.create.mockResolvedValue(crearPagoMock())
    mockDb.bookingPayment.count.mockResolvedValue(4)
    mockDb.bookingPayment.updateMany.mockResolvedValue({ count: 4 })

    await POST(crearWebhookRequest())

    expect(mockCrearNotificacion).toHaveBeenCalled()
    expect(mockEnviarEmailConfirmacion).toHaveBeenCalled()
  })

  it("checkout.session.completed booking sin bookingId/clubId hace skip", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("checkout.session.completed", {
      mode: "payment",
      metadata: { type: "booking_payment" }, // sin bookingId ni clubId
    }))

    const response = await POST(crearWebhookRequest())
    expect(response.status).toBe(200)
    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  // --- customer.subscription.updated ---

  it("customer.subscription.updated con clubId en metadata", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("customer.subscription.updated", {
      metadata: { clubId: "club-1" },
      status: "active",
      items: { data: [{ price: { id: "price_pro" } }] },
    }))
    mockGetPlanKeyFromPriceId.mockReturnValue("pro")

    await POST(crearWebhookRequest())

    expect(mockDb.club.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "club-1" },
        data: expect.objectContaining({
          subscriptionStatus: "active",
          subscriptionTier: "pro",
        }),
      })
    )
  })

  it("customer.subscription.updated sin clubId busca por stripeSubscriptionId", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("customer.subscription.updated", {
      id: "sub_123",
      metadata: {},
      status: "past_due",
      items: { data: [{ price: { id: "price_starter" } }] },
    }))
    mockDb.club.findFirst.mockResolvedValue(crearClubMock({ id: "club-found" }))
    mockGetPlanKeyFromPriceId.mockReturnValue("starter")

    await POST(crearWebhookRequest())

    expect(mockDb.club.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: "sub_123" },
      })
    )
    expect(mockDb.club.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "club-found" },
      })
    )
  })

  it("customer.subscription.updated club no encontrado hace skip", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("customer.subscription.updated", {
      id: "sub_inexistente",
      metadata: {},
      status: "active",
      items: { data: [{ price: { id: "price_x" } }] },
    }))
    mockDb.club.findFirst.mockResolvedValue(null)

    const response = await POST(crearWebhookRequest())
    expect(response.status).toBe(200)
    expect(mockDb.club.update).not.toHaveBeenCalled()
  })

  // --- customer.subscription.deleted ---

  it("customer.subscription.deleted marca club como canceled", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("customer.subscription.deleted", {
      id: "sub_del",
    }))
    mockDb.club.findFirst.mockResolvedValue(crearClubMock({ id: "club-del" }))

    await POST(crearWebhookRequest())

    expect(mockDb.club.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "club-del" },
        data: expect.objectContaining({
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
        }),
      })
    )
  })

  it("customer.subscription.deleted club no encontrado hace skip", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("customer.subscription.deleted", {
      id: "sub_ghost",
    }))
    mockDb.club.findFirst.mockResolvedValue(null)

    const response = await POST(crearWebhookRequest())
    expect(response.status).toBe(200)
    expect(mockDb.club.update).not.toHaveBeenCalled()
  })

  // --- invoice.paid ---

  it("invoice.paid crea Payment tipo subscription", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("invoice.paid", {
      customer: "cus_123",
      amount_paid: 4900,
      currency: "eur",
      id: "inv_test",
    }))
    mockDb.club.findFirst.mockResolvedValue(crearClubMock())

    await POST(crearWebhookRequest())

    expect(mockDb.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 49,
          type: "subscription",
          stripePaymentId: "inv_test",
        }),
      })
    )
  })

  it("invoice.paid club no encontrado hace skip", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("invoice.paid", {
      customer: "cus_ghost",
      amount_paid: 1900,
      id: "inv_ghost",
    }))
    mockDb.club.findFirst.mockResolvedValue(null)

    const response = await POST(crearWebhookRequest())
    expect(response.status).toBe(200)
    expect(mockDb.payment.create).not.toHaveBeenCalled()
  })

  // --- invoice.payment_failed ---

  it("invoice.payment_failed marca club como past_due", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("invoice.payment_failed", {
      customer: "cus_fail",
    }))
    mockDb.club.findFirst.mockResolvedValue(crearClubMock({ id: "club-fail" }))

    await POST(crearWebhookRequest())

    expect(mockDb.club.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "club-fail" },
        data: { subscriptionStatus: "past_due" },
      })
    )
  })

  // --- charge.refunded ---

  it("charge.refunded actualiza payment a refunded", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("charge.refunded", {
      payment_intent: "pi_refund_test",
    }))
    mockDb.payment.findFirst.mockResolvedValue(crearPagoMock({ id: "pay-ref", status: "succeeded" }))

    await POST(crearWebhookRequest())

    expect(mockDb.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pay-ref" },
        data: { status: "refunded" },
      })
    )
  })

  it("charge.refunded ya refunded o sin paymentIntentId hace skip", async () => {
    // Sin paymentIntentId
    mockConstructWebhookEvent.mockReturnValue(crearEvento("charge.refunded", {
      payment_intent: null,
    }))

    const response = await POST(crearWebhookRequest())
    expect(response.status).toBe(200)
    expect(mockDb.payment.findFirst).not.toHaveBeenCalled()
  })

  // --- customer.subscription.trial_will_end ---

  it("customer.subscription.trial_will_end notifica a admins", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("customer.subscription.trial_will_end", {
      id: "sub_trial",
    }))
    mockDb.club.findFirst.mockResolvedValue(crearClubMock())
    mockDb.user.findMany.mockResolvedValue([
      crearUsuarioMock({ id: "admin-1", role: "SUPER_ADMIN" }),
      crearUsuarioMock({ id: "admin-2", role: "CLUB_ADMIN" }),
    ])

    await POST(crearWebhookRequest())

    expect(mockCrearNotificacion).toHaveBeenCalledTimes(2)
    expect(mockCrearNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "subscription_trial_ending",
        userId: "admin-1",
      })
    )
  })

  // --- Evento desconocido ---

  it("evento desconocido retorna 200 received:true", async () => {
    mockConstructWebhookEvent.mockReturnValue(crearEvento("unknown.event", {}))

    const response = await POST(crearWebhookRequest())
    const data = await extraerJson(response) as { received: boolean }

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
  })
})
