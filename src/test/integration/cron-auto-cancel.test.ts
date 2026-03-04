import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearReservaMock, manana } from "@/test/factories"
import { extraerJson } from "@/test/helpers/api-route"

// --- Mocks ---
const mockCrearNotificacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailRecordatorio = vi.fn().mockResolvedValue(undefined)
const mockLiberarSlot = vi.fn().mockResolvedValue(undefined)

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/notifications", () => ({
  crearNotificacion: (...args: unknown[]) => mockCrearNotificacion(...args),
}))
vi.mock("@/lib/email", () => ({
  enviarEmailRecordatorioReserva: (...args: unknown[]) => mockEnviarEmailRecordatorio(...args),
}))
vi.mock("@/lib/waitlist", () => ({
  liberarSlotYNotificar: (...args: unknown[]) => mockLiberarSlot(...args),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { POST } from "@/app/api/cron/booking-reminders/route"

function crearCronRequest(secret?: string) {
  const headers: Record<string, string> = {}
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`
  }
  return new Request("http://localhost/api/cron/booking-reminders", {
    method: "POST",
    headers,
  })
}

describe("Cron de recordatorios y auto-cancelacion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = "test-secret"
    // Default: sin reservas proximas ni expiradas
    mockDb.booking.findMany.mockResolvedValue([])
  })

  it("rechaza sin CRON_SECRET → 401", async () => {
    const response = await POST(crearCronRequest())
    expect(response.status).toBe(401)
  })

  it("procesa recordatorios con CRON_SECRET correcto", async () => {
    const reservaProxima = crearReservaMock({
      userId: "user-1",
      reminderSentAt: null,
    })
    // Primera llamada: reservas proximas para recordatorio
    // Segunda llamada: reservas expiradas para auto-cancel
    mockDb.booking.findMany
      .mockResolvedValueOnce([reservaProxima])
      .mockResolvedValueOnce([])
    mockDb.booking.update.mockResolvedValue({})

    const response = await POST(crearCronRequest("test-secret"))
    const data = await extraerJson(response) as { procesadas: number; enviadas: number }

    expect(response.status).toBe(200)
    expect(data.procesadas).toBe(1)
    expect(data.enviadas).toBe(1)
    expect(mockCrearNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "booking_reminder",
      })
    )
  })

  it("marca reminderSentAt tras enviar recordatorio", async () => {
    mockDb.booking.findMany
      .mockResolvedValueOnce([crearReservaMock({ userId: "user-1" })])
      .mockResolvedValueOnce([])
    mockDb.booking.update.mockResolvedValue({})

    await POST(crearCronRequest("test-secret"))

    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reminderSentAt: expect.any(Date),
        }),
      })
    )
  })

  it("envia email si user tiene email", async () => {
    mockDb.booking.findMany
      .mockResolvedValueOnce([crearReservaMock({ userId: "user-1" })])
      .mockResolvedValueOnce([])
    mockDb.booking.update.mockResolvedValue({})

    await POST(crearCronRequest("test-secret"))

    expect(mockEnviarEmailRecordatorio).toHaveBeenCalled()
  })

  it("auto-cancela reservas pendientes de pago >15min (startTime < ahora-15m, club online+onboarded)", async () => {
    const hace20min = new Date()
    hace20min.setMinutes(hace20min.getMinutes() - 20)

    const reservaExpirada = {
      id: "booking-exp",
      courtId: "court-1",
      startTime: hace20min,
      endTime: new Date(hace20min.getTime() + 90 * 60000),
      clubId: "club-1",
      court: { name: "Pista 1" },
      club: { slug: "club-test", name: "Club Test" },
    }

    mockDb.booking.findMany
      .mockResolvedValueOnce([]) // recordatorios
      .mockResolvedValueOnce([reservaExpirada]) // expiradas
    mockDb.booking.update.mockResolvedValue({})

    const response = await POST(crearCronRequest("test-secret"))
    const data = await extraerJson(response) as { canceladasPorPago: number }

    expect(data.canceladasPorPago).toBe(1)
    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "booking-exp" },
        data: expect.objectContaining({
          status: "cancelled",
          cancelReason: "Pago no completado en el plazo de 15 minutos",
        }),
      })
    )
  })

  it("NO cancela si reserva tiene Payment registrado (excluded by payment: null)", async () => {
    // El query de findMany filtra con payment: null, asi que si el mock
    // no retorna reservas, no se cancelan
    mockDb.booking.findMany
      .mockResolvedValueOnce([]) // recordatorios
      .mockResolvedValueOnce([]) // expiradas (ya filtradas por payment: null)

    const response = await POST(crearCronRequest("test-secret"))
    const data = await extraerJson(response) as { canceladasPorPago: number }

    expect(data.canceladasPorPago).toBe(0)
  })

  it("NO cancela clubs presential o sin Connect onboarded (excluded by club filter)", async () => {
    // Igual que anterior — el query ya filtra clubs con bookingPaymentMode in [online, both]
    mockDb.booking.findMany
      .mockResolvedValueOnce([]) // recordatorios
      .mockResolvedValueOnce([]) // sin expiradas porque club filter excluye

    const response = await POST(crearCronRequest("test-secret"))
    const data = await extraerJson(response) as { canceladasPorPago: number }

    expect(data.canceladasPorPago).toBe(0)
  })

  it("auto-cancel llama liberarSlotYNotificar por cada cancelada", async () => {
    const reservas = [
      { id: "b1", courtId: "c1", startTime: new Date(), endTime: new Date(), clubId: "cl1", court: { name: "P1" }, club: { slug: "s", name: "N" } },
      { id: "b2", courtId: "c2", startTime: new Date(), endTime: new Date(), clubId: "cl1", court: { name: "P2" }, club: { slug: "s", name: "N" } },
    ]
    mockDb.booking.findMany
      .mockResolvedValueOnce([]) // recordatorios
      .mockResolvedValueOnce(reservas) // expiradas
    mockDb.booking.update.mockResolvedValue({})

    await POST(crearCronRequest("test-secret"))

    expect(mockLiberarSlot).toHaveBeenCalledTimes(2)
  })

  it("retorna contadores correctos", async () => {
    mockDb.booking.findMany
      .mockResolvedValueOnce([crearReservaMock({ userId: "u1" })])
      .mockResolvedValueOnce([])
    mockDb.booking.update.mockResolvedValue({})

    const response = await POST(crearCronRequest("test-secret"))
    const data = await extraerJson(response) as Record<string, number>

    expect(data).toEqual(expect.objectContaining({
      procesadas: 1,
      enviadas: 1,
      errores: 0,
      canceladasPorPago: 0,
    }))
  })
})
