import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock de Prisma
const mockClubFindUnique = vi.fn()
const mockUserFindUnique = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    club: { findUnique: (...args: any[]) => mockClubFindUnique(...args) },
    user: { findUnique: (...args: any[]) => mockUserFindUnique(...args) },
  },
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

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}))

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(() => ({ id: "credentials", name: "Credentials" })),
}))

vi.mock("./tokens", () => ({
  crearTokenRecuperacion: vi.fn(),
}))

vi.mock("./email", () => ({
  enviarEmailActivacionCuenta: vi.fn(),
}))

vi.mock("./logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { authOptions } from "./auth"

// Extraer el callback jwt para testear directamente
const jwtCallback = authOptions.callbacks!.jwt! as any

describe("JWT callback - TTL de suscripcion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("primera invocacion sin subscriptionRefreshedAt hace query DB", async () => {
    mockClubFindUnique.mockResolvedValue({
      subscriptionStatus: "active",
      trialEndsAt: null,
    })

    const token = { id: "user-1", clubId: "club-1" } as any

    const resultado = await jwtCallback({ token })

    expect(mockClubFindUnique).toHaveBeenCalledOnce()
    expect(resultado.subscriptionStatus).toBe("active")
    expect(resultado.trialEndsAt).toBeNull()
    expect(resultado.subscriptionRefreshedAt).toBeTypeOf("number")
  })

  it("dentro del TTL (2 min) NO hace query DB", async () => {
    const haceDosMinutos = Date.now() - 2 * 60 * 1000

    const token = {
      id: "user-1",
      clubId: "club-1",
      subscriptionStatus: "active",
      trialEndsAt: null,
      subscriptionRefreshedAt: haceDosMinutos,
    } as any

    const resultado = await jwtCallback({ token })

    expect(mockClubFindUnique).not.toHaveBeenCalled()
    expect(resultado.subscriptionStatus).toBe("active")
    expect(resultado.subscriptionRefreshedAt).toBe(haceDosMinutos)
  })

  it("fuera del TTL (6 min) hace query DB y actualiza timestamp", async () => {
    const haceSeisMinutos = Date.now() - 6 * 60 * 1000

    mockClubFindUnique.mockResolvedValue({
      subscriptionStatus: "canceled",
      trialEndsAt: new Date("2025-12-31"),
    })

    const token = {
      id: "user-1",
      clubId: "club-1",
      subscriptionStatus: "active",
      trialEndsAt: null,
      subscriptionRefreshedAt: haceSeisMinutos,
    } as any

    const antes = Date.now()
    const resultado = await jwtCallback({ token })

    expect(mockClubFindUnique).toHaveBeenCalledOnce()
    expect(resultado.subscriptionStatus).toBe("canceled")
    expect(resultado.trialEndsAt).toBe("2025-12-31T00:00:00.000Z")
    expect(resultado.subscriptionRefreshedAt).toBeGreaterThanOrEqual(antes)
  })

  it("token sin clubId no hace query de suscripcion", async () => {
    const token = { id: "user-1" } as any

    const resultado = await jwtCallback({ token })

    expect(mockClubFindUnique).not.toHaveBeenCalled()
    expect(resultado.subscriptionStatus).toBeUndefined()
    expect(resultado.subscriptionRefreshedAt).toBeUndefined()
  })
})
