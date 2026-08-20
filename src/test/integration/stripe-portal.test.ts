import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearSesionAdminMock } from "@/test/factories"

const mockRequireAuth = vi.fn()
const mockPortalCreate = vi.fn()

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: () => false,
}))
vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: { sessions: { create: (...args: unknown[]) => mockPortalCreate(...args) } },
  },
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { POST } from "@/app/api/stripe/portal/route"

describe("Customer Portal de Stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NEXTAUTH_URL", "https://padelclubos.com")
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ stripeCustomerId: "cus_test" }))
    mockPortalCreate.mockResolvedValue({ url: "https://billing.stripe.com/test" })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("fija la configuración acordada del portal", async () => {
    vi.stubEnv("STRIPE_PORTAL_CONFIGURATION_ID", "bpc_test")

    const response = await POST()

    expect(response.status).toBe(200)
    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: "cus_test",
      return_url: "https://padelclubos.com/dashboard/facturacion",
      configuration: "bpc_test",
    })
  })

  it("mantiene compatibilidad local si aún no existe una configuración", async () => {
    vi.stubEnv("STRIPE_PORTAL_CONFIGURATION_ID", "")

    await POST()

    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: "cus_test",
      return_url: "https://padelclubos.com/dashboard/facturacion",
    })
  })
})
