import { describe, it, expect, vi, beforeEach } from "vitest"

const mockVerificar = vi.fn().mockResolvedValue(true)

// Mock dependencies before importing the route
vi.mock("@/lib/db", () => ({
  db: {
    contactSubmission: {
      create: vi.fn().mockResolvedValue({ id: "test-id" }),
    },
  },
}))

vi.mock("@/lib/email", () => ({
  enviarEmailSolicitudDemo: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  crearRateLimiter: () => ({ verificar: (...args: unknown[]) => mockVerificar(...args) }),
  obtenerIP: () => "127.0.0.1",
}))

import { POST } from "./route"
import { db } from "@/lib/db"

function crearRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const bodyValido = {
  nombre: "Juan Garcia",
  email: "juan@club.com",
  clubNombre: "Club Padel Sevilla",
  numeroPistas: 6,
  softwareActual: "matchpoint",
  urgencia: "proximo-mes",
}

describe("POST /api/demo", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerificar.mockResolvedValue(true)
  })

  it("devuelve 201 con datos validos", async () => {
    const res = await POST(crearRequest(bodyValido))
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.message).toContain("demo")

    expect(db.contactSubmission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tipo: "demo",
        nombre: "Juan Garcia",
        email: "juan@club.com",
        clubNombre: "Club Padel Sevilla",
        numeroPistas: 6,
        softwareActual: "matchpoint",
        urgencia: "proximo-mes",
        asunto: "Solicitud de demo",
      }),
    })
  })

  it("devuelve 400 sin campo requerido (clubNombre)", async () => {
    const { clubNombre, ...sinClub } = bodyValido
    const res = await POST(crearRequest(sinClub))
    expect(res.status).toBe(400)
  })

  it("devuelve 400 con email invalido", async () => {
    const res = await POST(crearRequest({ ...bodyValido, email: "no-email" }))
    expect(res.status).toBe(400)
  })

  it("devuelve 400 con softwareActual invalido", async () => {
    const res = await POST(crearRequest({ ...bodyValido, softwareActual: "invalido" }))
    expect(res.status).toBe(400)
  })

  it("normaliza source valida correctamente", async () => {
    const res = await POST(crearRequest({ ...bodyValido, source: "hero" }))
    expect(res.status).toBe(201)
    const { enviarEmailSolicitudDemo } = await import("@/lib/email")
    expect(enviarEmailSolicitudDemo).toHaveBeenCalledWith(
      expect.objectContaining({ source: "hero" })
    )
  })

  it("normaliza source desconocida a 'unknown'", async () => {
    const res = await POST(crearRequest({ ...bodyValido, source: "random-thing" }))
    expect(res.status).toBe(201)
    const { enviarEmailSolicitudDemo } = await import("@/lib/email")
    expect(enviarEmailSolicitudDemo).toHaveBeenCalledWith(
      expect.objectContaining({ source: "unknown" })
    )
  })

  it("devuelve 429 cuando rate limit activo", async () => {
    mockVerificar.mockResolvedValueOnce(false)
    const res = await POST(crearRequest(bodyValido))
    expect(res.status).toBe(429)
  })

  it("acepta campos opcionales omitidos", async () => {
    const res = await POST(crearRequest(bodyValido))
    expect(res.status).toBe(201)
  })

  it("acepta todos los campos opcionales", async () => {
    const bodyCompleto = {
      ...bodyValido,
      telefono: "+34 612 345 678",
      mensaje: "Necesitamos migracion rapida",
      source: "pricing",
      paginaOrigen: "/demo",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "padel-clubs-espana",
    }
    const res = await POST(crearRequest(bodyCompleto))
    expect(res.status).toBe(201)
  })
})
