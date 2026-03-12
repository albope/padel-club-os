import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"

vi.mock("@/lib/db", () => ({ db: mockDb }))

vi.mock("@/lib/stripe", () => ({
  PLAN_PRICES: {
    starter: {
      name: "Starter",
      price: 19,
      limits: { courts: 4, members: 50, admins: 1 },
    },
    pro: {
      name: "Pro",
      price: 49,
      limits: { courts: -1, members: 500, admins: 3 },
    },
    enterprise: {
      name: "Enterprise",
      price: 99,
      limits: { courts: -1, members: -1, admins: -1 },
    },
  },
}))

import {
  isSubscriptionActive,
  getSubscriptionInfo,
  getPlanLimits,
  canCreateCourt,
  canCreateMember,
  canCreateAdmin,
} from "./subscription"

describe("isSubscriptionActive", () => {
  it("retorna true para status 'active'", () => {
    expect(isSubscriptionActive("active", null)).toBe(true)
  })

  it("retorna true para status 'active' con trialEndsAt pasado", () => {
    expect(isSubscriptionActive("active", new Date("2020-01-01"))).toBe(true)
  })

  it("retorna true para status 'trialing' sin fecha", () => {
    expect(isSubscriptionActive("trialing", null)).toBe(true)
  })

  it("retorna true para trial con fecha futura", () => {
    const futuro = new Date(Date.now() + 86400000) // +1 dia
    expect(isSubscriptionActive("trialing", futuro)).toBe(true)
  })

  it("retorna false para trial con fecha pasada", () => {
    const pasado = new Date("2020-01-01")
    expect(isSubscriptionActive("trialing", pasado)).toBe(false)
  })

  it("retorna false para status 'canceled'", () => {
    expect(isSubscriptionActive("canceled", null)).toBe(false)
  })

  it("retorna false para status 'past_due'", () => {
    expect(isSubscriptionActive("past_due", null)).toBe(false)
  })

  it("retorna false para status 'unpaid'", () => {
    expect(isSubscriptionActive("unpaid", null)).toBe(false)
  })

  it("retorna true para status null (default a 'trialing' sin fecha)", () => {
    expect(isSubscriptionActive(null, null)).toBe(true)
  })

  it("retorna false para status null con trial expirado", () => {
    expect(isSubscriptionActive(null, new Date("2020-01-01"))).toBe(false)
  })
})

describe("getPlanLimits", () => {
  it("retorna limites de starter", () => {
    const limits = getPlanLimits("starter" as any)
    expect(limits).toEqual({ courts: 4, members: 50, admins: 1 })
  })

  it("retorna limites de pro", () => {
    const limits = getPlanLimits("pro" as any)
    expect(limits).toEqual({ courts: -1, members: 500, admins: 3 })
  })

  it("retorna limites de enterprise (todos ilimitados)", () => {
    const limits = getPlanLimits("enterprise" as any)
    expect(limits).toEqual({ courts: -1, members: -1, admins: -1 })
  })
})

describe("getSubscriptionInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna isActive:true para suscripcion activa", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "active",
      subscriptionTier: "pro",
      trialEndsAt: null,
    })

    const info = await getSubscriptionInfo("club-1")
    expect(info.isActive).toBe(true)
    expect(info.isGracePeriod).toBe(false)
    expect(info.isBlocked).toBe(false)
    expect(info.tier).toBe("pro")
  })

  it("retorna isGracePeriod:true para past_due", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "past_due",
      subscriptionTier: "starter",
      trialEndsAt: null,
    })

    const info = await getSubscriptionInfo("club-1")
    expect(info.isActive).toBe(false)
    expect(info.isGracePeriod).toBe(true)
    expect(info.isBlocked).toBe(false)
  })

  it("retorna isBlocked:true para canceled", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "canceled",
      subscriptionTier: "starter",
      trialEndsAt: null,
    })

    const info = await getSubscriptionInfo("club-1")
    expect(info.isActive).toBe(false)
    expect(info.isGracePeriod).toBe(false)
    expect(info.isBlocked).toBe(true)
  })

  it("usa defaults si club no existe", async () => {
    mockDb.club.findUnique.mockResolvedValue(null)

    const info = await getSubscriptionInfo("club-inexistente")
    expect(info.status).toBe("trialing")
    expect(info.tier).toBe("starter")
  })
})

describe("canCreateCourt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("permite si esta bajo el limite", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "active",
      subscriptionTier: "starter",
      trialEndsAt: null,
    })
    mockDb.court.count.mockResolvedValue(2)

    const result = await canCreateCourt("club-1")
    expect(result.allowed).toBe(true)
  })

  it("bloquea si alcanzo el limite del plan starter (4)", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "active",
      subscriptionTier: "starter",
      trialEndsAt: null,
    })
    mockDb.court.count.mockResolvedValue(4)

    const result = await canCreateCourt("club-1")
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("Starter")
    expect(result.reason).toContain("4")
  })

  it("siempre permite para plan enterprise (ilimitado)", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "active",
      subscriptionTier: "enterprise",
      trialEndsAt: null,
    })

    const result = await canCreateCourt("club-1")
    expect(result.allowed).toBe(true)
    // No deberia haber consultado el count
    expect(mockDb.court.count).not.toHaveBeenCalled()
  })
})

describe("canCreateMember", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("permite si esta bajo el limite", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "active",
      subscriptionTier: "starter",
      trialEndsAt: null,
    })
    mockDb.user.count.mockResolvedValue(30)

    const result = await canCreateMember("club-1")
    expect(result.allowed).toBe(true)
  })

  it("bloquea si alcanzo el limite de socios (50 para starter)", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "active",
      subscriptionTier: "starter",
      trialEndsAt: null,
    })
    mockDb.user.count.mockResolvedValue(50)

    const result = await canCreateMember("club-1")
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("50")
  })
})

describe("canCreateAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("permite si esta bajo el limite de admins", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "active",
      subscriptionTier: "starter",
      trialEndsAt: null,
    })
    mockDb.user.count.mockResolvedValue(0)
    mockDb.adminInvitation.count.mockResolvedValue(0)

    const result = await canCreateAdmin("club-1")
    expect(result.allowed).toBe(true)
  })

  it("bloquea si alcanzo el limite de admins (1 para starter)", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "active",
      subscriptionTier: "starter",
      trialEndsAt: null,
    })
    mockDb.user.count.mockResolvedValue(1)
    mockDb.adminInvitation.count.mockResolvedValue(0)

    const result = await canCreateAdmin("club-1")
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("1")
  })

  it("cuenta invitaciones pendientes en el limite", async () => {
    mockDb.club.findUnique.mockResolvedValue({
      subscriptionStatus: "active",
      subscriptionTier: "starter",
      trialEndsAt: null,
    })
    mockDb.user.count.mockResolvedValue(0)
    mockDb.adminInvitation.count.mockResolvedValue(1)

    const result = await canCreateAdmin("club-1")
    expect(result.allowed).toBe(false)
    expect(result.used).toBe(1)
  })
})
