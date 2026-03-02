import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

// Mock de dependencias
const mockGetServerSession = vi.fn()

vi.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}))

vi.mock("./auth", () => ({
  authOptions: {},
}))

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(),
  UserRole: {
    SUPER_ADMIN: "SUPER_ADMIN",
    CLUB_ADMIN: "CLUB_ADMIN",
    STAFF: "STAFF",
    PLAYER: "PLAYER",
  },
}))

vi.mock("@/lib/db", () => ({ db: {} }))

vi.mock("@/lib/stripe", () => ({
  PLAN_PRICES: {
    starter: { name: "Starter", limits: { courts: 4, members: 50, admins: 1 } },
    pro: { name: "Pro", limits: { courts: -1, members: 500, admins: 3 } },
    enterprise: { name: "Enterprise", limits: { courts: -1, members: -1, admins: -1 } },
  },
}))

import { requireAuth, isAuthError } from "./api-auth"

// Helper para crear sesiones mock
function crearSesion(overrides = {}) {
  return {
    user: {
      id: "user-1",
      clubId: "club-1",
      role: "CLUB_ADMIN",
      name: "Admin",
      email: "admin@test.com",
      subscriptionStatus: "active",
      trialEndsAt: null,
      ...overrides,
    },
  }
}

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna 401 si no hay sesion", async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await requireAuth("bookings:read")
    expect(result).toBeInstanceOf(NextResponse)
    if (result instanceof NextResponse) {
      expect(result.status).toBe(401)
      const body = await result.json()
      expect(body.error).toBe("No autenticado")
    }
  })

  it("retorna 403 si el usuario no tiene clubId", async () => {
    mockGetServerSession.mockResolvedValue(
      crearSesion({ clubId: null })
    )

    const result = await requireAuth("bookings:read")
    expect(result).toBeInstanceOf(NextResponse)
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403)
      const body = await result.json()
      expect(body.error).toBe("Usuario sin club asignado")
    }
  })

  it("retorna 403 si no tiene el permiso requerido", async () => {
    mockGetServerSession.mockResolvedValue(
      crearSesion({ role: "PLAYER" })
    )

    const result = await requireAuth("users:create")
    expect(result).toBeInstanceOf(NextResponse)
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403)
      const body = await result.json()
      expect(body.error).toBe("Sin permisos para esta accion")
    }
  })

  it("retorna AuthResult si tiene el permiso", async () => {
    mockGetServerSession.mockResolvedValue(crearSesion())

    const result = await requireAuth("bookings:read")
    expect(result).not.toBeInstanceOf(NextResponse)
    if (!(result instanceof NextResponse)) {
      expect(result.session.user.id).toBe("user-1")
      expect(result.session.user.clubId).toBe("club-1")
      expect(result.session.user.role).toBe("CLUB_ADMIN")
    }
  })

  it("permite sin permiso especifico (solo verifica sesion + clubId)", async () => {
    mockGetServerSession.mockResolvedValue(crearSesion())

    const result = await requireAuth()
    expect(result).not.toBeInstanceOf(NextResponse)
  })

  it("permite admin con suscripcion activa y requireSubscription:true", async () => {
    mockGetServerSession.mockResolvedValue(
      crearSesion({ subscriptionStatus: "active" })
    )

    const result = await requireAuth("bookings:create", { requireSubscription: true })
    expect(result).not.toBeInstanceOf(NextResponse)
  })

  it("bloquea admin con suscripcion cancelada y requireSubscription:true", async () => {
    mockGetServerSession.mockResolvedValue(
      crearSesion({ subscriptionStatus: "canceled" })
    )

    const result = await requireAuth("bookings:create", { requireSubscription: true })
    expect(result).toBeInstanceOf(NextResponse)
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403)
      const body = await result.json()
      expect(body.code).toBe("SUBSCRIPTION_INACTIVE")
    }
  })

  it("bloquea admin con trial expirado y requireSubscription:true", async () => {
    mockGetServerSession.mockResolvedValue(
      crearSesion({
        subscriptionStatus: "trialing",
        trialEndsAt: "2020-01-01T00:00:00Z",
      })
    )

    const result = await requireAuth("courts:create", { requireSubscription: true })
    expect(result).toBeInstanceOf(NextResponse)
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403)
    }
  })

  it("no verifica suscripcion para PLAYER aunque requireSubscription:true", async () => {
    mockGetServerSession.mockResolvedValue(
      crearSesion({
        role: "PLAYER",
        subscriptionStatus: "canceled",
      })
    )

    // PLAYER tiene permiso bookings:create
    const result = await requireAuth("bookings:create", { requireSubscription: true })
    expect(result).not.toBeInstanceOf(NextResponse)
  })
})

describe("isAuthError", () => {
  it("retorna true para NextResponse", () => {
    const response = NextResponse.json({ error: "test" }, { status: 401 })
    expect(isAuthError(response)).toBe(true)
  })

  it("retorna false para AuthResult", () => {
    const authResult = {
      session: {
        user: {
          id: "1",
          clubId: "c1",
          role: "CLUB_ADMIN" as any,
        },
      },
    }
    expect(isAuthError(authResult as any)).toBe(false)
  })
})
