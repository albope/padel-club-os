import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearSesionAdminMock } from "@/test/factories"
import { crearRequest } from "@/test/helpers/api-route"

const mockRequireAuth = vi.fn()
const mockCheckoutCreate = vi.fn()
const mockCustomerCreate = vi.fn()

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: () => false,
}))
vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: { create: (...args: unknown[]) => mockCustomerCreate(...args) },
    checkout: { sessions: { create: (...args: unknown[]) => mockCheckoutCreate(...args) } },
  },
  PLAN_PRICES: {
    starter: { monthly: "price_starter" },
    pro: { monthly: "price_pro" },
    enterprise: { monthly: "price_enterprise" },
  },
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { POST } from "@/app/api/stripe/checkout/route"

interface ParametrosCheckout {
  subscription_data: Record<string, unknown>
}

function parametrosCheckout(): ParametrosCheckout {
  return mockCheckoutCreate.mock.calls[0][0] as ParametrosCheckout
}

async function crearCheckout(overrides: Record<string, unknown>) {
  mockDb.club.findUnique.mockResolvedValue(crearClubMock({
    stripeCustomerId: "cus_test",
    subscriptionStatus: "trialing",
    trialEndsAt: new Date("2026-08-01T12:00:00.000Z"),
    ...overrides,
  }))

  return POST(crearRequest({ body: { planKey: "starter" } }))
}

describe("Checkout de suscripcion Stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-22T12:00:00.000Z"))
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock({ email: "admin@test.demo" }))
    mockCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/test" })
    process.env.NEXTAUTH_URL = "http://localhost:3000"
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("hereda exactamente el trial restante si supera 48 horas y nunca hubo suscripcion", async () => {
    const trialEndsAt = new Date("2026-07-30T18:45:12.000Z")

    const response = await crearCheckout({ trialEndsAt })

    expect(response.status).toBe(200)
    expect(parametrosCheckout().subscription_data).toEqual({
      metadata: { clubId: "club-1", planKey: "starter" },
      trial_end: Math.floor(trialEndsAt.getTime() / 1000),
    })
    expect(parametrosCheckout().subscription_data).not.toHaveProperty("trial_period_days")
  })

  it("cobra inmediatamente si el trial de la app ya caduco", async () => {
    const response = await crearCheckout({
      trialEndsAt: new Date("2026-07-21T12:00:00.000Z"),
    })

    expect(response.status).toBe(200)
    expect(parametrosCheckout().subscription_data).toEqual({
      metadata: { clubId: "club-1", planKey: "starter" },
    })
  })

  it("cobra inmediatamente si quedan menos de las 48 horas minimas de Stripe", async () => {
    await crearCheckout({
      trialEndsAt: new Date("2026-07-24T11:59:59.000Z"),
    })

    expect(parametrosCheckout().subscription_data).not.toHaveProperty("trial_end")
    expect(parametrosCheckout().subscription_data).not.toHaveProperty("trial_period_days")
  })

  it("cobra inmediatamente si el club conserva un ID de suscripcion anterior", async () => {
    await crearCheckout({ stripeSubscriptionId: "sub_anterior" })

    expect(parametrosCheckout().subscription_data).not.toHaveProperty("trial_end")
    expect(parametrosCheckout().subscription_data).not.toHaveProperty("trial_period_days")
  })

  it("cobra inmediatamente al recontratar tras cancelar aunque el trialEndsAt sea futuro", async () => {
    await crearCheckout({
      stripeSubscriptionId: null,
      subscriptionStatus: "canceled",
    })

    expect(parametrosCheckout().subscription_data).toEqual({
      metadata: { clubId: "club-1", planKey: "starter" },
    })
  })
})
