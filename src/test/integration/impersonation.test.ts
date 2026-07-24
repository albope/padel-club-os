import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  mockRequireAuth,
  mockIsAuthError,
  mockOriginAllowed,
  mockIssueJwt,
  mockSetCookie,
  mockAudit,
  mockGetServerSession,
  mockDb,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockIsAuthError: vi.fn((_result: unknown) => false),
  mockOriginAllowed: vi.fn((_request: Request) => true),
  mockIssueJwt: vi.fn(async (_token: unknown, _maxAge?: number) => "signed-session"),
  mockSetCookie: vi.fn((_response: unknown, _token: string, _maxAge?: number) => undefined),
  mockAudit: vi.fn((_payload: unknown) => undefined),
  mockGetServerSession: vi.fn((_options: unknown): unknown => null),
  mockDb: {
    clubMembership: {
      findUnique: vi.fn(),
    },
    impersonationSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("@/lib/api-auth", () => ({
  requireAuth: (permission?: unknown) => mockRequireAuth(permission),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))
vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/tokens", () => ({
  generarTokenAleatorio: () => "support-token",
  hashToken: () => "support-token-hash",
}))
vi.mock("@/lib/session-cookie", () => ({
  emitirSesionJwt: (token: unknown, maxAge?: number) => mockIssueJwt(token, maxAge),
  establecerCookieSesion: (response: unknown, token: string, maxAge?: number) =>
    mockSetCookie(response, token, maxAge),
  origenPermitido: (request: Request) => mockOriginAllowed(request),
}))
vi.mock("@/lib/audit", () => ({ registrarAuditoria: (payload: unknown) => mockAudit(payload) }))
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }))
vi.mock("next-auth", () => ({
  getServerSession: (options: unknown) => mockGetServerSession(options),
}))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

import { POST as startImpersonation } from "@/app/api/platform/impersonation/start/route"
import { POST as stopImpersonation } from "@/app/api/platform/impersonation/stop/route"

const actorSession = {
  session: {
    user: {
      id: "super-1",
      name: "Soporte",
      email: "soporte@example.test",
      clubId: "platform",
      role: "SUPER_ADMIN",
    },
  },
}

const membership = {
  id: "membership-1",
  status: "ACTIVE",
  role: "PLAYER",
  user: {
    id: "player-1",
    name: "Jugador Demo",
    email: "player@example.test",
    image: null,
    isActive: true,
    sessionVersion: 3,
  },
  club: {
    id: "club-1",
    name: "Club Demo",
    slug: "club-demo",
  },
}

function request(body: unknown): Request {
  return new Request("https://app.example.test/api/platform/impersonation/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://app.example.test",
    },
    body: JSON.stringify(body),
  })
}

describe("impersonacion de soporte", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOriginAllowed.mockReturnValue(true)
    mockIsAuthError.mockReturnValue(false)
    mockRequireAuth.mockResolvedValue(actorSession)
    mockDb.clubMembership.findUnique.mockResolvedValue(membership)
    mockDb.impersonationSession.create.mockResolvedValue({ id: "imp-1" })
    mockIssueJwt.mockResolvedValue("signed-session")
  })

  it("rechaza una peticion con origen no permitido antes de autenticar", async () => {
    mockOriginAllowed.mockReturnValue(false)

    const response = await startImpersonation(request({
      userId: "player-1",
      clubId: "club-1",
      reason: "Revisar incidencia reportada",
    }))

    expect(response.status).toBe(403)
    expect(mockRequireAuth).not.toHaveBeenCalled()
  })

  it("exige un motivo suficientemente descriptivo", async () => {
    const response = await startImpersonation(request({
      userId: "player-1",
      clubId: "club-1",
      reason: "mirar",
    }))

    expect(response.status).toBe(400)
    expect(mockDb.impersonationSession.create).not.toHaveBeenCalled()
  })

  it("crea una sesion temporal, auditada y de solo lectura para el jugador exacto", async () => {
    const response = await startImpersonation(request({
      userId: "player-1",
      clubId: "club-1",
      reason: "Revisar incidencia reportada",
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      redirectUrl: "/club/club-demo",
      readOnly: true,
    })
    expect(mockDb.clubMembership.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_clubId: { userId: "player-1", clubId: "club-1" } },
      }),
    )
    expect(mockDb.impersonationSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "super-1",
        subjectId: "player-1",
        clubId: "club-1",
        tokenHash: "support-token-hash",
        readOnly: true,
      }),
    })
    expect(mockIssueJwt).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "player-1",
        clubId: "club-1",
        role: "PLAYER",
        actorId: "super-1",
        impersonationId: "imp-1",
        impersonationToken: "support-token",
        impersonationReadOnly: true,
      }),
      1800,
    )
    expect(mockSetCookie).toHaveBeenCalledWith(response, "signed-session", 1800)
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({
      recurso: "impersonation",
      entidadId: "imp-1",
      userId: "super-1",
    }))
  })

  it("restaura al super administrador y cierra la sesion una sola vez", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        actorId: "super-1",
        impersonationId: "imp-1",
        authInvalid: false,
      },
    })
    mockDb.impersonationSession.findFirst.mockResolvedValue({
      id: "imp-1",
      clubId: "club-1",
      actor: {
        id: "super-1",
        name: "Soporte",
        email: "soporte@example.test",
        image: null,
        role: "SUPER_ADMIN",
        clubId: null,
        isActive: true,
        sessionVersion: 7,
        club: null,
        memberships: [{
          clubId: "platform",
          club: { name: "Plataforma" },
        }],
      },
    })
    mockDb.impersonationSession.update.mockResolvedValue({ id: "imp-1" })

    const response = await stopImpersonation(new Request(
      "https://app.example.test/api/platform/impersonation/stop",
      { method: "POST", headers: { origin: "https://app.example.test" } },
    ))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.redirectUrl).toBe("/dashboard/accesos")
    expect(mockDb.impersonationSession.findFirst).toHaveBeenCalledWith({
      where: {
        id: "imp-1",
        actorId: "super-1",
        endedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      include: expect.any(Object),
    })
    expect(mockDb.impersonationSession.update).toHaveBeenCalledWith({
      where: { id: "imp-1" },
      data: { endedAt: expect.any(Date) },
    })
    expect(mockIssueJwt).toHaveBeenCalledWith(expect.objectContaining({
      id: "super-1",
      role: "SUPER_ADMIN",
      clubId: "platform",
      sessionVersion: 7,
    }), undefined)
    expect(mockSetCookie).toHaveBeenCalledWith(response, "signed-session", undefined)
  })
})
