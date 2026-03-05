import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearReservaMock, crearSesionMock, manana } from "@/test/factories"
import { crearRequest, extraerJson } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()
const mockStripeCheckout = {
  create: vi.fn(),
  expire: vi.fn().mockResolvedValue({}),
  retrieve: vi.fn(),
}

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: () => false,
}))
vi.mock("@/lib/validation", async () => {
  const actual = await vi.importActual("@/lib/validation")
  return actual
})
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

// --- Helpers ---
const reservaOnline = () => crearReservaMock({
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

const clubConConnect = () => crearClubMock({
  stripeConnectAccountId: "acct_test_123",
  stripeConnectOnboarded: true,
  slug: "club-test",
  name: "Club Test",
})

// =============================================================================
// Checkout Atomicity: lock, session reuse, concurrent requests, expiracion
// =============================================================================
describe("Checkout atomicity y concurrencia", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(reservaOnline())
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.club.findUnique.mockResolvedValue(clubConConnect())
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 }) // lock adquirido
    mockDb.booking.update.mockResolvedValue({})
    mockStripeCheckout.create.mockResolvedValue({ id: "cs_new", url: "https://checkout.stripe.com/new" })
    process.env.NEXTAUTH_URL = "http://localhost:3000"
  })

  // --- Lock handling ---

  it("adquiere lock atomico via updateMany antes de crear session", async () => {
    await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(mockDb.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "booking-1",
          status: "confirmed",
          paymentStatus: "pending",
          OR: expect.arrayContaining([
            { checkoutLockUntil: null },
            expect.objectContaining({ checkoutLockUntil: expect.any(Object) }),
          ]),
        }),
        data: expect.objectContaining({
          checkoutLockUntil: expect.any(Date),
        }),
      })
    )
  })

  it("lock no adquirido (concurrent request) → 409", async () => {
    mockDb.booking.updateMany.mockResolvedValue({ count: 0 }) // otro proceso tiene el lock

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(response.status).toBe(409)
    const data = await extraerJson(response) as { error: string }
    expect(data.error).toContain("proceso de pago en curso")
    // NO debe crear session de Stripe
    expect(mockStripeCheckout.create).not.toHaveBeenCalled()
  })

  it("lock expirado → se puede readquirir (checkoutLockUntil < now en OR)", async () => {
    // La reserva tiene un lock expirado
    mockDb.booking.findFirst.mockResolvedValue({
      ...reservaOnline(),
      checkoutLockUntil: new Date(Date.now() - 60000), // expirado hace 1 min
    })
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 }) // lock readquirido

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(response.status).toBe(200)
    expect(mockStripeCheckout.create).toHaveBeenCalled()
  })

  // --- Session reuse (idempotencia) ---

  it("reutiliza session existente si aun esta open", async () => {
    const futuro = new Date(Date.now() + 600000) // 10 min en el futuro
    mockDb.booking.findFirst.mockResolvedValue({
      ...reservaOnline(),
      checkoutSessionId: "cs_existing",
      checkoutSessionExpiresAt: futuro,
    })
    mockStripeCheckout.retrieve.mockResolvedValue({
      status: "open",
      url: "https://checkout.stripe.com/existing",
    })

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))
    const data = await extraerJson(response) as { url: string }

    expect(response.status).toBe(200)
    expect(data.url).toBe("https://checkout.stripe.com/existing")
    // NO debe crear una nueva session
    expect(mockStripeCheckout.create).not.toHaveBeenCalled()
    // NO debe adquirir lock
    expect(mockDb.booking.updateMany).not.toHaveBeenCalled()
  })

  it("crea nueva session si la existente esta expirada (checkoutSessionExpiresAt < now)", async () => {
    const pasado = new Date(Date.now() - 60000) // 1 min en el pasado
    mockDb.booking.findFirst.mockResolvedValue({
      ...reservaOnline(),
      checkoutSessionId: "cs_old",
      checkoutSessionExpiresAt: pasado,
    })

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))
    const data = await extraerJson(response) as { url: string }

    expect(response.status).toBe(200)
    expect(data.url).toBe("https://checkout.stripe.com/new")
    // Debe adquirir lock y crear nueva
    expect(mockDb.booking.updateMany).toHaveBeenCalled()
    expect(mockStripeCheckout.create).toHaveBeenCalled()
  })

  it("crea nueva session si retrieve falla (session no encontrada en Stripe)", async () => {
    const futuro = new Date(Date.now() + 600000)
    mockDb.booking.findFirst.mockResolvedValue({
      ...reservaOnline(),
      checkoutSessionId: "cs_deleted",
      checkoutSessionExpiresAt: futuro,
    })
    mockStripeCheckout.retrieve.mockRejectedValue(new Error("No such session"))

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))
    const data = await extraerJson(response) as { url: string }

    expect(response.status).toBe(200)
    expect(data.url).toBe("https://checkout.stripe.com/new")
    expect(mockStripeCheckout.create).toHaveBeenCalled()
  })

  it("crea nueva session si retrieve devuelve status != open", async () => {
    const futuro = new Date(Date.now() + 600000)
    mockDb.booking.findFirst.mockResolvedValue({
      ...reservaOnline(),
      checkoutSessionId: "cs_completed",
      checkoutSessionExpiresAt: futuro,
    })
    mockStripeCheckout.retrieve.mockResolvedValue({
      status: "complete",
      url: null,
    })

    await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(mockDb.booking.updateMany).toHaveBeenCalled()
    expect(mockStripeCheckout.create).toHaveBeenCalled()
  })

  // --- Expire session previa ---

  it("expira session previa antes de crear nueva", async () => {
    mockDb.booking.findFirst.mockResolvedValue({
      ...reservaOnline(),
      checkoutSessionId: "cs_old_session",
      checkoutSessionExpiresAt: new Date(Date.now() - 1000),
    })

    await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(mockStripeCheckout.expire).toHaveBeenCalledWith("cs_old_session")
    expect(mockStripeCheckout.create).toHaveBeenCalled()
  })

  it("error en expire no bloquea creacion de nueva session", async () => {
    mockDb.booking.findFirst.mockResolvedValue({
      ...reservaOnline(),
      checkoutSessionId: "cs_broken",
      checkoutSessionExpiresAt: new Date(Date.now() - 1000),
    })
    mockStripeCheckout.expire.mockRejectedValue(new Error("Already expired"))

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(response.status).toBe(200)
    expect(mockStripeCheckout.create).toHaveBeenCalled()
  })

  // --- Lock cleanup on errors ---

  it("limpia lock si Stripe create falla", async () => {
    mockStripeCheckout.create.mockRejectedValue(new Error("Stripe down"))

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(response.status).toBe(500)
    // Debe limpiar el lock
    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "booking-1" },
        data: { checkoutLockUntil: null },
      })
    )
  })

  it("limpia lock si club no tiene Connect configurado", async () => {
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({
      stripeConnectAccountId: null,
    }))

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(response.status).toBe(400)
    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { checkoutLockUntil: null },
      })
    )
  })

  // --- Persist sessionId ---

  it("persiste sessionId y expiresAt tras crear session exitosa", async () => {
    await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    const updateCalls = mockDb.booking.update.mock.calls
    const lastCall = updateCalls[updateCalls.length - 1]
    expect(lastCall[0]).toEqual(
      expect.objectContaining({
        where: { id: "booking-1" },
        data: expect.objectContaining({
          checkoutSessionId: "cs_new",
          checkoutLockUntil: null,
        }),
      })
    )
    expect(lastCall[0].data.checkoutSessionExpiresAt).toBeInstanceOf(Date)
  })

  // --- Aislamiento por club ---

  it("booking.findFirst filtra por userId y clubId del jugador", async () => {
    await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(mockDb.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          clubId: "club-1",
        }),
      })
    )
  })

  // --- Booking cancelada durante checkout ---

  it("booking cancelada entre find y lock → lock falla (count=0)", async () => {
    mockDb.booking.updateMany.mockResolvedValue({ count: 0 })

    const response = await POST(crearRequest({ body: { bookingId: "booking-1" } }))

    expect(response.status).toBe(409)
    expect(mockStripeCheckout.create).not.toHaveBeenCalled()
  })
})
