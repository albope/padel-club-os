import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearRequest } from "@/test/helpers/api-route"

const mockVerificar = vi.fn()

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/rate-limit", () => ({
  crearRateLimiter: () => ({ verificar: (...args: unknown[]) => mockVerificar(...args) }),
  obtenerIP: () => "127.0.0.1",
}))
vi.mock("@/lib/email", () => ({
  enviarEmailBienvenidaAdmin: vi.fn().mockResolvedValue(undefined),
  enviarEmailVerificacion: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/tokens", () => ({
  crearTokenVerificacionEmail: vi.fn().mockResolvedValue("verification-token"),
}))
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }))
vi.mock("bcrypt", () => ({ hash: vi.fn().mockResolvedValue("password-hash") }))

import { POST } from "@/app/api/register/route"

describe("Registro contractual de un club", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerificar.mockResolvedValue(true)
    mockDb.user.findUnique.mockResolvedValue(null)
    mockDb.club.findUnique.mockResolvedValue(null)
    mockDb.club.create.mockResolvedValue({
      id: "club-legal",
      name: "Ana's Club",
      slug: "ana-s-club",
      trialEndsAt: new Date("2026-08-05T00:00:00.000Z"),
    })
    mockDb.user.create.mockResolvedValue({
      id: "user-legal",
      name: "Ana",
      email: "ana@club.test",
      password: "password-hash",
      clubId: "club-legal",
      role: "CLUB_ADMIN",
    })
    mockDb.legalAcceptance.create.mockResolvedValue({ id: "acceptance-legal" })
    mockDb.clubMembership.create.mockResolvedValue({ id: "membership-legal" })
  })

  it("guarda las versiones aceptadas junto con la cuenta", async () => {
    const response = await POST(crearRequest({
      body: {
        name: "Ana",
        clubName: "Club Ana",
        email: "ana@club.test",
        password: "Password123!",
        legalAccepted: true,
      },
    }))

    expect(response.status).toBe(201)
    expect(mockDb.legalAcceptance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        audience: "CLUB",
        termsVersion: "2026-07-22",
        dpaVersion: "2026-07-22",
        privacyVersion: "2026-07-22",
        acceptedByEmail: "ana@club.test",
        userId: "user-legal",
        clubId: "club-legal",
      }),
    })
  })

  it("no crea una cuenta sin aceptacion expresa", async () => {
    const response = await POST(crearRequest({
      body: {
        name: "Ana",
        clubName: "Club Ana",
        email: "ana@club.test",
        password: "Password123!",
        legalAccepted: false,
      },
    }))

    expect(response.status).toBe(400)
    expect(mockDb.club.create).not.toHaveBeenCalled()
    expect(mockDb.legalAcceptance.create).not.toHaveBeenCalled()
  })
})
