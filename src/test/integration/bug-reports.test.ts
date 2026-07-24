import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"
import { mockDb } from "@/test/mocks/db"
import { crearParams, crearRequest } from "@/test/helpers/api-route"

const mockRequireAuth = vi.fn()
const mockRateLimit = vi.fn()
const mockRegistrarAuditoria = vi.fn()

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: (result: unknown) => result instanceof NextResponse,
}))
vi.mock("@/lib/rate-limit", () => ({
  crearRateLimiter: () => ({ verificar: (...args: unknown[]) => mockRateLimit(...args) }),
}))
vi.mock("@/lib/audit", () => ({
  registrarAuditoria: (...args: unknown[]) => mockRegistrarAuditoria(...args),
}))
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))
vi.mock("@sentry/nextjs", () => ({
  withScope: vi.fn(),
  captureMessage: vi.fn(),
}))

import { GET, POST } from "@/app/api/bug-reports/route"
import { PATCH } from "@/app/api/bug-reports/[reportId]/route"

const authResult = {
  session: {
    user: {
      id: "user-1",
      clubId: "club-1",
      role: "PLAYER",
      name: "Jugador",
      impersonationId: null,
    },
  },
}

describe("Reportes de errores", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(authResult)
    mockRateLimit.mockResolvedValue(true)
  })

  it("guarda solo contexto tecnico permitido y elimina origen, query y fragmento", async () => {
    mockDb.bugReport.create.mockResolvedValue({
      id: "report-1",
      status: "NEW",
      createdAt: new Date("2026-07-24T00:00:00.000Z"),
    })

    const response = await POST(crearRequest({
      body: {
        category: "BUG",
        description: "La reserva se queda cargando al confirmar.",
        pageUrl: "https://otro-dominio.test/club/demo/reservar?token=secreto#pago",
        viewport: "1440x900",
        metadata: {
          locale: "es",
          password: "nunca-debe-guardarse",
          arbitrary: { secret: true },
        },
      },
      headers: { "user-agent": "Vitest browser" },
    }))

    expect(response.status).toBe(201)
    expect(mockDb.bugReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        pageUrl: "/club/demo/reservar",
        viewport: "1440x900",
        userAgent: "Vitest browser",
        userId: "user-1",
        clubId: "club-1",
        metadata: {
          locale: "es",
          role: "PLAYER",
          impersonationId: undefined,
        },
      }),
      select: { id: true, status: true, createdAt: true },
    })
  })

  it("rechaza entradas invalidas antes de escribir", async () => {
    const response = await POST(crearRequest({
      body: { category: "UNKNOWN", description: "corto" },
    }))

    expect(response.status).toBe(400)
    expect(mockDb.bugReport.create).not.toHaveBeenCalled()
  })

  it("limita el abuso por usuario", async () => {
    mockRateLimit.mockResolvedValue(false)

    const response = await POST(crearRequest({
      body: {
        category: "BUG",
        description: "Descripcion suficientemente larga.",
      },
    }))

    expect(response.status).toBe(429)
    expect(mockDb.bugReport.create).not.toHaveBeenCalled()
  })

  it("reserva el listado a soporte de plataforma", async () => {
    mockDb.bugReport.findMany.mockResolvedValue([])

    const response = await GET(crearRequest({
      method: "GET",
      url: "http://localhost/api/bug-reports?status=NEW",
    }))

    expect(response.status).toBe(200)
    expect(mockRequireAuth).toHaveBeenCalledWith("platform:read")
    expect(mockDb.bugReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "NEW" }, take: 250 }),
    )
  })

  it("audita los cambios de estado realizados por plataforma", async () => {
    mockDb.bugReport.findUnique.mockResolvedValue({ id: "report-1", clubId: "club-1" })
    mockDb.bugReport.update.mockResolvedValue({ id: "report-1", status: "RESOLVED" })

    const response = await PATCH(
      crearRequest({ method: "PATCH", body: { status: "RESOLVED" } }),
      crearParams({ reportId: "report-1" }),
    )

    expect(response.status).toBe(200)
    expect(mockRequireAuth).toHaveBeenCalledWith("platform:manage")
    expect(mockDb.bugReport.update).toHaveBeenCalledWith({
      where: { id: "report-1" },
      data: { status: "RESOLVED", resolvedAt: expect.any(Date) },
    })
    expect(mockRegistrarAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        recurso: "bug-report",
        accion: "actualizar",
        entidadId: "report-1",
      }),
    )
  })
})
