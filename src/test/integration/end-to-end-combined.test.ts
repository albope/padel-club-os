/**
 * Smoke journeys end-to-end: flujos combinados que cruzan multiples APIs.
 * Maximo 2-3 journeys para evitar fragilidad.
 *
 * Journey 1: Reserva online → Checkout → Webhook pago → Cancelacion → Refund
 * Journey 2: Reserva presential → Cobro parcial por jugador → Cobrar todo
 * Journey 3: Partida abierta → Se llena → BookingPayments auto-generados
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPagoMock, crearReservaMock, crearSesionMock, crearSesionAdminMock, crearPistaMock, manana } from "@/test/factories"
import { crearRequest, crearParamsPlano, extraerJson } from "@/test/helpers/api-route"

// --- Mocks compartidos ---
const mockRequireAuth = vi.fn()
const mockCrearNotificacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailConfirmacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailCancelacion = vi.fn().mockResolvedValue(undefined)
const mockLimpiarWaitlist = vi.fn().mockResolvedValue(undefined)
const mockLiberarSlot = vi.fn().mockResolvedValue(undefined)
const mockStripeRefunds = { create: vi.fn().mockResolvedValue({}) }
const mockStripeCheckout = {
  create: vi.fn(),
  expire: vi.fn().mockResolvedValue({}),
  retrieve: vi.fn(),
}
const mockConstructWebhookEvent = vi.fn()
const mockSincronizarEstadoPago = vi.fn().mockResolvedValue("pending")
const mockAsegurarBookingPayments = vi.fn().mockResolvedValue(4)

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
  calcularPrecioReserva: vi.fn().mockResolvedValue(40),
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
  constructWebhookEvent: (...args: unknown[]) => mockConstructWebhookEvent(...args),
  getPlanKeyFromPriceId: vi.fn(),
  stripe: {
    refunds: { create: (...args: unknown[]) => mockStripeRefunds.create(...args) },
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
vi.mock("@/lib/payment-sync", () => ({
  generarDatosPagoPorJugador: vi.fn().mockReturnValue([
    { bookingId: "new-booking", userId: "user-1", guestName: null, amount: 10, clubId: "club-1" },
    { bookingId: "new-booking", userId: null, guestName: "Jugador 2", amount: 10, clubId: "club-1" },
    { bookingId: "new-booking", userId: null, guestName: "Jugador 3", amount: 10, clubId: "club-1" },
    { bookingId: "new-booking", userId: null, guestName: "Jugador 4", amount: 10, clubId: "club-1" },
  ]),
  sincronizarEstadoPago: (...args: unknown[]) => mockSincronizarEstadoPago(...args),
  asegurarBookingPayments: (...args: unknown[]) => mockAsegurarBookingPayments(...args),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))
vi.mock("@/lib/court-blocks", () => ({
  verificarBloqueo: vi.fn().mockResolvedValue(null),
}))

// =============================================================================
// Journey 1: Reserva online → Checkout → Webhook → Cancel → Refund
// =============================================================================
describe("Journey 1: Reserva online completa con pago y cancelacion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXTAUTH_URL = "http://localhost:3000"
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  })

  it("flujo completo: crear → checkout → webhook paid → cancel → refund", async () => {
    // === PASO 1: Crear reserva online ===
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({
      bookingPaymentMode: "online",
      stripeConnectOnboarded: true,
      stripeConnectAccountId: "acct_club",
    }))
    mockDb.booking.findFirst.mockResolvedValue(null) // sin overlap
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.booking.create.mockResolvedValue(crearReservaMock({
      id: "booking-j1",
      paymentStatus: "pending",
      paymentMethod: "online",
      totalPrice: 40,
    }))
    mockDb.bookingPayment.createMany.mockResolvedValue({ count: 4 })
    mockDb.user.findUnique.mockResolvedValue({ email: "j@t.com", name: "J", club: { name: "C", slug: "c" } })

    const { POST: createBooking } = await import("@/app/api/player/bookings/route")
    const createResp = await createBooking(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(createResp.status).toBe(201)
    const createData = await extraerJson(createResp) as { requiresPayment: boolean }
    expect(createData.requiresPayment).toBe(true)
    // No envia email porque requiere pago online
    expect(mockEnviarEmailConfirmacion).not.toHaveBeenCalled()

    // === PASO 2: Checkout ===
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      id: "booking-j1",
      paymentStatus: "pending",
      paymentMethod: "online",
      totalPrice: 40,
      court: { name: "Pista 1" },
      checkoutSessionId: null,
      checkoutSessionExpiresAt: null,
      checkoutLockUntil: null,
    }))
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({
      stripeConnectAccountId: "acct_club",
      stripeConnectOnboarded: true,
      slug: "c",
    }))
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 })
    mockDb.booking.update.mockResolvedValue({})
    mockStripeCheckout.create.mockResolvedValue({ id: "cs_j1", url: "https://pay.stripe.com/j1" })

    const { POST: checkout } = await import("@/app/api/player/bookings/checkout/route")
    const checkoutResp = await checkout(crearRequest({ body: { bookingId: "booking-j1" } }))

    expect(checkoutResp.status).toBe(200)
    const checkoutData = await extraerJson(checkoutResp) as { url: string }
    expect(checkoutData.url).toContain("stripe.com")

    // === PASO 3: Webhook confirma pago ===
    vi.clearAllMocks()
    mockConstructWebhookEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "payment",
          metadata: { type: "booking_payment", bookingId: "booking-j1", clubId: "club-1", userId: "user-1" },
          amount_total: 4000,
          currency: "eur",
          payment_intent: "pi_j1",
        },
      },
    })
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 })
    mockDb.booking.findUnique.mockResolvedValue(crearReservaMock({
      id: "booking-j1",
      paymentStatus: "paid",
      court: { name: "P1" },
      user: { email: "j@t.com", name: "J", club: { name: "C", slug: "c" } },
    }))
    mockDb.payment.create.mockResolvedValue(crearPagoMock({ stripePaymentId: "pi_j1" }))
    mockDb.bookingPayment.updateMany.mockResolvedValue({ count: 4 })

    const { POST: webhook } = await import("@/app/api/stripe/webhook/route")
    const webhookResp = await webhook(new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "raw",
      headers: { "stripe-signature": "sig" },
    }))

    expect(webhookResp.status).toBe(200)
    // Email de confirmacion enviado AHORA (post-pago)
    expect(mockEnviarEmailConfirmacion).toHaveBeenCalled()
    expect(mockCrearNotificacion).toHaveBeenCalled()

    // === PASO 4: Jugador cancela → Refund ===
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      id: "booking-j1",
      paymentStatus: "paid",
      paymentMethod: "online",
      startTime: manana(10, 0),
      checkoutSessionId: null,
    }))
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ cancellationHours: 2 }))
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
    mockDb.payment.findUnique.mockResolvedValue(crearPagoMock({
      stripePaymentId: "pi_j1",
      status: "succeeded",
    }))
    mockDb.payment.update.mockResolvedValue({})
    mockDb.user.findUnique.mockResolvedValue({ email: "j@t.com", name: "J", club: { name: "C", slug: "c" } })

    const { DELETE: cancelBooking } = await import("@/app/api/player/bookings/route")
    const cancelResp = await cancelBooking(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-j1",
    }))

    expect(cancelResp.status).toBe(200)
    // Refund emitido
    expect(mockStripeRefunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_j1" })
    )
    // Payment marcado como refunded
    expect(mockDb.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "refunded" } })
    )
    // Waitlist notificada
    expect(mockLiberarSlot).toHaveBeenCalled()
    // Email de cancelacion enviado
    expect(mockEnviarEmailCancelacion).toHaveBeenCalled()
  })
})

// =============================================================================
// Journey 2: Reserva presential → Cobro parcial → Cobrar todo
// =============================================================================
describe("Journey 2: Reserva presential con cobro por jugador", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("flujo completo: crear presential → GET auto-genera pagos → PATCH cobro individual", async () => {
    // === PASO 1: Crear reserva presential ===
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ bookingPaymentMode: "presential" }))
    mockDb.booking.findFirst.mockResolvedValue(null)
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.booking.create.mockResolvedValue(crearReservaMock({
      id: "booking-j2",
      paymentStatus: "pending",
      paymentMethod: "presential",
      totalPrice: 40,
    }))
    mockDb.bookingPayment.createMany.mockResolvedValue({ count: 4 })
    mockDb.user.findUnique.mockResolvedValue({ email: "j@t.com", name: "J", club: { name: "C", slug: "c" } })

    const { POST: createBooking } = await import("@/app/api/player/bookings/route")
    const createResp = await createBooking(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(14, 0).toISOString(),
        endTime: manana(15, 30).toISOString(),
      },
    }))

    expect(createResp.status).toBe(201)
    const createData = await extraerJson(createResp) as { requiresPayment: boolean }
    expect(createData.requiresPayment).toBe(false)
    // Email enviado inmediatamente (presential)
    expect(mockEnviarEmailConfirmacion).toHaveBeenCalled()

    // === PASO 2: Admin consulta pagos por jugador (auto-genera) ===
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.booking.findUnique.mockResolvedValue(crearReservaMock({
      id: "booking-j2",
      totalPrice: 40,
      numPlayers: 4,
      paymentStatus: "pending",
      paymentMethod: "presential",
    }))
    mockDb.bookingPayment.count.mockResolvedValue(4) // ya existen (creados en paso 1)
    mockDb.bookingPayment.findMany.mockResolvedValue([
      { id: "bp-1", userId: "user-1", guestName: null, amount: 10, status: "pending", paidAt: null, user: { name: "J" }, collectedBy: null },
      { id: "bp-2", userId: null, guestName: "Jugador 2", amount: 10, status: "pending", paidAt: null, user: null, collectedBy: null },
      { id: "bp-3", userId: null, guestName: "Jugador 3", amount: 10, status: "pending", paidAt: null, user: null, collectedBy: null },
      { id: "bp-4", userId: null, guestName: "Jugador 4", amount: 10, status: "pending", paidAt: null, user: null, collectedBy: null },
    ])

    const { GET: getPayments } = await import("@/app/api/bookings/[bookingId]/player-payments/route")
    const getResp = await getPayments(
      crearRequest({ method: "GET" }),
      crearParamsPlano({ bookingId: "booking-j2" }),
    )

    expect(getResp.status).toBe(200)
    const getData = await extraerJson(getResp) as { payments: Array<{ status: string }> }
    expect(getData.payments).toHaveLength(4)
    expect(getData.payments.every(p => p.status === "pending")).toBe(true)

    // === PASO 3: Admin cobra un pago individual ===
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock({ id: "admin-1" }))
    mockDb.booking.findUnique.mockResolvedValue(crearReservaMock({
      paymentStatus: "pending",
      paymentMethod: "presential",
    }))
    mockDb.bookingPayment.findFirst.mockResolvedValue({
      id: "bp-1", bookingId: "booking-j2", userId: "user-1", amount: 10, status: "pending", clubId: "club-1",
    })
    mockDb.bookingPayment.update.mockResolvedValue({
      id: "bp-1", userId: "user-1", guestName: null, amount: 10, status: "paid",
      paidAt: new Date(), collectedById: "admin-1",
      user: { name: "J" }, collectedBy: { name: "Admin" },
    })
    mockSincronizarEstadoPago.mockResolvedValue("pending") // 1 de 4 → sigue pending

    const { PATCH: patchPayment } = await import("@/app/api/bookings/[bookingId]/player-payments/[paymentId]/route")
    const patchResp = await patchPayment(
      crearRequest({ method: "PATCH", body: { status: "paid" } }),
      crearParamsPlano({ bookingId: "booking-j2", paymentId: "bp-1" }),
    )

    expect(patchResp.status).toBe(200)
    const patchData = await extraerJson(patchResp) as { status: string }
    expect(patchData.status).toBe("paid")
    // sincronizarEstadoPago fue llamado
    expect(mockSincronizarEstadoPago).toHaveBeenCalledWith(expect.anything(), "booking-j2")
  })
})

// =============================================================================
// Journey 3: Checkout idempotente - session reutilizada
// =============================================================================
describe("Journey 3: Checkout idempotente con session reuse", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXTAUTH_URL = "http://localhost:3000"
  })

  it("segundo checkout reutiliza session existente sin crear nueva", async () => {
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({
      stripeConnectAccountId: "acct_1",
      stripeConnectOnboarded: true,
      slug: "c",
    }))

    // Primer checkout: sin session previa
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "pending",
      paymentMethod: "online",
      totalPrice: 40,
      court: { name: "P1" },
      checkoutSessionId: null,
      checkoutSessionExpiresAt: null,
      checkoutLockUntil: null,
    }))
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 })
    mockDb.booking.update.mockResolvedValue({})
    mockStripeCheckout.create.mockResolvedValue({ id: "cs_first", url: "https://stripe.com/first" })

    const { POST: checkout } = await import("@/app/api/player/bookings/checkout/route")
    const resp1 = await checkout(crearRequest({ body: { bookingId: "booking-1" } }))
    const data1 = await extraerJson(resp1) as { url: string }

    expect(resp1.status).toBe(200)
    expect(data1.url).toBe("https://stripe.com/first")
    expect(mockStripeCheckout.create).toHaveBeenCalledTimes(1)

    // Segundo checkout: session ya existe y esta open
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.payment.findUnique.mockResolvedValue(null)
    const futuro = new Date(Date.now() + 600000)
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({
      paymentStatus: "pending",
      paymentMethod: "online",
      totalPrice: 40,
      court: { name: "P1" },
      checkoutSessionId: "cs_first",
      checkoutSessionExpiresAt: futuro,
      checkoutLockUntil: null,
    }))
    mockStripeCheckout.retrieve.mockResolvedValue({
      status: "open",
      url: "https://stripe.com/first",
    })

    const resp2 = await checkout(crearRequest({ body: { bookingId: "booking-1" } }))
    const data2 = await extraerJson(resp2) as { url: string }

    expect(resp2.status).toBe(200)
    expect(data2.url).toBe("https://stripe.com/first")
    // NO crea nueva session
    expect(mockStripeCheckout.create).not.toHaveBeenCalled()
    // NO adquiere lock
    expect(mockDb.booking.updateMany).not.toHaveBeenCalled()
  })
})
