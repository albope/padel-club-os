import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"
import { mockDb } from "@/test/mocks/db"
import { crearParams, crearRequest } from "@/test/helpers/api-route"

const mockRequireAuth = vi.fn()
const mockEnviarEmailRespuestaLead = vi.fn()

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: (result: unknown) => result instanceof NextResponse,
}))
vi.mock("@/lib/email", () => ({
  enviarEmailRespuestaLead: (...args: unknown[]) => mockEnviarEmailRespuestaLead(...args),
}))
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { POST } from "@/app/api/leads/[leadId]/reply/route"

describe("Respuesta por email a leads", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue({
      session: {
        user: {
          id: "superadmin-1",
          clubId: "platform-club",
          role: "SUPER_ADMIN",
        },
      },
    })
    mockDb.contactSubmission.findUnique.mockResolvedValue({
      id: "lead-1",
      email: "lead@club.test",
    })
    mockDb.contactSubmission.update.mockResolvedValue({ id: "lead-1", leido: true })
    mockEnviarEmailRespuestaLead.mockResolvedValue(undefined)
  })

  it("envía al email guardado y marca la solicitud como leída", async () => {
    const response = await POST(
      crearRequest({
        method: "POST",
        body: {
          asunto: "Re: Solicitud de demo",
          mensaje: "Hola Fernando,\n\nTe escribo para concretar la demo.",
        },
      }),
      crearParams({ leadId: "lead-1" }),
    )

    expect(response.status).toBe(200)
    expect(mockRequireAuth).toHaveBeenCalledWith("leads:update")
    expect(mockEnviarEmailRespuestaLead).toHaveBeenCalledWith({
      email: "lead@club.test",
      asunto: "Re: Solicitud de demo",
      mensaje: "Hola Fernando,\n\nTe escribo para concretar la demo.",
    })
    expect(mockDb.contactSubmission.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: { leido: true },
    })
  })

  it("no permite responder a una solicitud inexistente", async () => {
    mockDb.contactSubmission.findUnique.mockResolvedValue(null)

    const response = await POST(
      crearRequest({
        method: "POST",
        body: { asunto: "Respuesta", mensaje: "Mensaje válido" },
      }),
      crearParams({ leadId: "missing" }),
    )

    expect(response.status).toBe(404)
    expect(mockEnviarEmailRespuestaLead).not.toHaveBeenCalled()
  })

  it("rechaza asuntos con saltos de línea y no envía el email", async () => {
    const response = await POST(
      crearRequest({
        method: "POST",
        body: { asunto: "Asunto\r\nBcc: otro@test.com", mensaje: "Mensaje válido" },
      }),
      crearParams({ leadId: "lead-1" }),
    )

    expect(response.status).toBe(400)
    expect(mockDb.contactSubmission.findUnique).not.toHaveBeenCalled()
    expect(mockEnviarEmailRespuestaLead).not.toHaveBeenCalled()
  })

  it("no marca como leída una solicitud si el proveedor de correo falla", async () => {
    mockEnviarEmailRespuestaLead.mockRejectedValue(new Error("Resend no disponible"))

    const response = await POST(
      crearRequest({
        method: "POST",
        body: { asunto: "Respuesta", mensaje: "Mensaje válido" },
      }),
      crearParams({ leadId: "lead-1" }),
    )

    expect(response.status).toBe(500)
    expect(mockDb.contactSubmission.update).not.toHaveBeenCalled()
  })
})
