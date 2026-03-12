import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock de db
const mockCreate = vi.fn()
vi.mock("@/lib/db", () => ({
  db: {
    auditLog: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

// Mock de logger
const mockWarn = vi.fn()
vi.mock("@/lib/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => mockWarn(...args),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

import { registrarAuditoria } from "./audit"

describe("registrarAuditoria", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("llama a db.auditLog.create con datos correctos", async () => {
    mockCreate.mockResolvedValue({ id: "test-id" })

    registrarAuditoria({
      recurso: "booking",
      accion: "crear",
      entidadId: "booking-123",
      detalles: { pistaId: "court-1", fecha: "2026-03-12" },
      userId: "user-1",
      userName: "Test User",
      clubId: "club-1",
      clubName: "Club Test",
    })

    // Esperar a que la promesa se resuelva
    await vi.waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1)
    })

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        recurso: "booking",
        accion: "crear",
        entidadId: "booking-123",
        detalles: { pistaId: "court-1", fecha: "2026-03-12" },
        userId: "user-1",
        userName: "Test User",
        origen: "usuario",
        clubId: "club-1",
        clubName: "Club Test",
      },
    })
  })

  it("usa origen 'cron' cuando se especifica", async () => {
    mockCreate.mockResolvedValue({ id: "test-id" })

    registrarAuditoria({
      recurso: "booking",
      accion: "cancelar",
      entidadId: "booking-456",
      detalles: { motivo: "impago_15min" },
      origen: "cron",
      clubId: "club-1",
    })

    await vi.waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1)
    })

    const llamada = mockCreate.mock.calls[0][0]
    expect(llamada.data.origen).toBe("cron")
    expect(llamada.data.userId).toBeUndefined()
    expect(llamada.data.userName).toBeUndefined()
  })

  it("no lanza excepcion cuando db.create falla", async () => {
    mockCreate.mockRejectedValue(new Error("DB connection failed"))

    // No debe lanzar
    expect(() => {
      registrarAuditoria({
        recurso: "court",
        accion: "crear",
        clubId: "club-1",
        userId: "user-1",
      })
    }).not.toThrow()

    // Esperar a que el catch se ejecute
    await vi.waitFor(() => {
      expect(mockWarn).toHaveBeenCalledWith(
        "AUDIT",
        "Error al registrar auditoria",
        expect.objectContaining({ recurso: "court", accion: "crear" }),
        expect.any(Error)
      )
    })
  })
})
