import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearReservaMock, crearPagoMock, crearSesionMock, manana } from "@/test/factories"
import { crearRequest, extraerJson } from "@/test/helpers/api-route"

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

const mockStripeCheckout = { create: vi.fn(), expire: vi.fn().mockResolvedValue({}), retrieve: vi.fn() }
vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockStripeCheckout.create(...args),
        expire: (...args: unknown[]) => mockStripeCheckout.expire(...args),
        retrieve: (...args: unknown[]) => mockStripeCheckout.retrieve(...args),
      },
    },
  },
  PLATFORM_FEE_PERCENT: 5,
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { POST } from "@/app/api/player/bookings/checkout/route"

describe("Checkout de Stripe para reservas", () => {
  const reservaConPago = crearReservaMock({
    paymentStatus: "pending",
    paymentMethod: "online",
    totalPrice: 40,
    startTime: manana(10, 0),
    endTime: manana(11, 30),
    court: { name: "Pista 1" },
    checkoutSessionId: null,
    checkoutSessionExpiresAt: null,
    checkoutLockUntil: null,
  })

  const clubConConnect = crearClubMock({
    stripeConnectAccountId: "acct_test_123",
    stripeConnectOnboarded: true,
    slug: "club-test",
    name: "Club Test",
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(reservaConPago)
    mockDb.payment.findUnique.mockResolvedValue(null) // sin pago previo
    mockDb.club.findUnique.mockResolvedValue(clubConConnect)
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 }) // lock adquirido
    mockDb.booking.update.mockResolvedValue({}) // persist sessionId
    mockStripeCheckout.create.mockResolvedValue({ id: "cs_test", url: "https://checkout.stripe.com/test" })
    process.env.NEXTAUTH_URL = "http://localhost:3000"
  })

  it("crea Checkout Session exitosamente con precio, fee 5% y transfer_data", async () => {
    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))
    const data = await extraerJson(response) as { url: string }

    expect(response.status).toBe(200)
    expect(data.url).toBe("https://checkout.stripe.com/test")
    expect(mockStripeCheckout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        payment_intent_data: expect.objectContaining({
          application_fee_amount: 200, // 5% de 4000 centimos
          transfer_data: { destination: "acct_test_123" },
        }),
      })
    )
  })

  it("rechaza body invalido sin bookingId", async () => {
    const response = await POST(crearRequest({ body: {} }))
    expect(response.status).toBe(400)
  })

  it("rechaza si reserva no encontrada o no pending", async () => {
    mockDb.booking.findFirst.mockResolvedValue(null)

    const response = await POST(crearRequest({ body: { bookingId: "inexistente" } }))
    expect(response.status).toBe(404)
  })

  it("rechaza si reserva no pertenece al jugador (userId mismatch)", async () => {
    mockDb.booking.findFirst.mockResolvedValue(null) // findFirst con where userId no encuentra

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))
    expect(response.status).toBe(404)
    expect(mockDb.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
        }),
      })
    )
  })

  it("rechaza si ya existe un pago para esta reserva (idempotencia)", async () => {
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock())

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))
    expect(response.status).toBe(400)
  })

  it("rechaza si club no tiene stripeConnectAccountId", async () => {
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({
      stripeConnectAccountId: null,
      stripeConnectOnboarded: true,
    }))

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))
    expect(response.status).toBe(400)
  })

  it("rechaza si club tiene stripeConnectOnboarded=false", async () => {
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({
      stripeConnectAccountId: "acct_test",
      stripeConnectOnboarded: false,
    }))

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))
    expect(response.status).toBe(400)
  })

  it("calcula applicationFee correctamente (5% de totalCentimos)", async () => {
    const reserva = crearReservaMock({
      paymentStatus: "pending",
      totalPrice: 60, // 6000 centimos → fee = 300
      startTime: manana(10, 0),
      endTime: manana(11, 30),
      court: { name: "Pista 1" },
    })
    mockDb.booking.findFirst.mockResolvedValue(reserva)

    await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(mockStripeCheckout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [expect.objectContaining({
          price_data: expect.objectContaining({ unit_amount: 6000 }),
        })],
        payment_intent_data: expect.objectContaining({
          application_fee_amount: 300,
        }),
      })
    )
  })

  it("URLs de success/cancel incluyen slug del club", async () => {
    await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(mockStripeCheckout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: expect.stringContaining("/club/club-test/reservar?pago=exito"),
        cancel_url: expect.stringContaining("/club/club-test/reservar?pago=cancelado"),
      })
    )
  })

  it("respuesta incluye session.url", async () => {
    mockStripeCheckout.create.mockResolvedValue({ id: "cs_123", url: "https://stripe.com/pay" })

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))
    const data = await extraerJson(response) as { url: string }

    expect(data.url).toBe("https://stripe.com/pay")
  })
})
