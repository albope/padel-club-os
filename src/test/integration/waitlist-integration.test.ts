import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPistaMock, crearReservaMock, crearPartidaMock, crearSesionMock, crearSesionAdminMock, manana } from "@/test/factories"
import { crearRequest, crearParamsPlano, crearParams } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()
const mockLimpiarWaitlist = vi.fn().mockResolvedValue(undefined)
const mockLiberarSlot = vi.fn().mockResolvedValue(undefined)
const mockCrearNotificacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailCancelacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailConfirmacion = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailRecordatorio = vi.fn().mockResolvedValue(undefined)
const mockEnviarEmailReagendamiento = vi.fn().mockResolvedValue(undefined)

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("@/lib/api-auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthError: () => false,
}))
vi.mock("@/lib/validation", async () => {
  const actual = await vi.importActual("@/lib/validation")
  return actual
})
vi.mock("@/lib/pricing", () => ({
  calcularPrecioReserva: vi.fn().mockResolvedValue(20),
}))
vi.mock("@/lib/notifications", () => ({
  crearNotificacion: (...args: unknown[]) => mockCrearNotificacion(...args),
}))
vi.mock("@/lib/email", () => ({
  enviarEmailCancelacionReserva: (...args: unknown[]) => mockEnviarEmailCancelacion(...args),
  enviarEmailConfirmacionReserva: (...args: unknown[]) => mockEnviarEmailConfirmacion(...args),
  enviarEmailRecordatorioReserva: (...args: unknown[]) => mockEnviarEmailRecordatorio(...args),
  enviarEmailReagendamientoReserva: (...args: unknown[]) => mockEnviarEmailReagendamiento(...args),
}))
vi.mock("@/lib/waitlist", () => ({
  limpiarWaitlistAlReservar: (...args: unknown[]) => mockLimpiarWaitlist(...args),
  liberarSlotYNotificar: (...args: unknown[]) => mockLiberarSlot(...args),
}))
vi.mock("@/lib/stripe", () => ({
  stripe: { refunds: { create: vi.fn().mockResolvedValue({}) } },
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))
vi.mock("@prisma/client", () => ({
  OpenMatchStatus: { OPEN: "OPEN", FULL: "FULL", CONFIRMED: "CONFIRMED", CANCELLED: "CANCELLED" },
}))

// Importar handlers
import { DELETE as playerBookingDELETE } from "@/app/api/player/bookings/route"
import { DELETE as adminBookingDELETE } from "@/app/api/bookings/[bookingId]/route"
import { POST as playerBookingPOST } from "@/app/api/player/bookings/route"
import { PATCH as reschedule } from "@/app/api/player/bookings/[bookingId]/reschedule/route"
import { POST as cronPOST } from "@/app/api/cron/booking-reminders/route"
import { POST as openMatchPOST } from "@/app/api/open-matches/route"
import { PATCH as openMatchPATCH } from "@/app/api/open-matches/[matchId]/route"

describe("Contrato de waitlist cross-route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
    mockDb.payment.findUnique.mockResolvedValue(null)
    mockDb.user.findUnique.mockResolvedValue({ email: "j@test.com", name: "J", club: { name: "C", slug: "c" } })
    mockDb.bookingPayment.createMany.mockResolvedValue({ count: 4 })
  })

  it("cancelar reserva jugador llama liberarSlotYNotificar con params correctos", async () => {
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock({ slug: "mi-club", name: "Mi Club" }))

    await playerBookingDELETE(crearRequest({
      method: "DELETE",
      url: "http://localhost/api/player/bookings?bookingId=booking-1",
    }))

    expect(mockLiberarSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        courtId: "court-1",
        clubId: "club-1",
        clubSlug: "mi-club",
        clubNombre: "Mi Club",
        pistaNombre: "Pista 1",
      })
    )
  })

  it("eliminar reserva admin (futura) llama liberarSlotYNotificar", async () => {
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    const reservaFutura = crearReservaMock({
      startTime: manana(10, 0),
      endTime: manana(11, 30),
    })
    mockDb.booking.findUnique.mockResolvedValue(reservaFutura)
    mockDb.booking.delete.mockResolvedValue({})

    await adminBookingDELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ bookingId: "booking-1" })
    )

    expect(mockLiberarSlot).toHaveBeenCalled()
  })

  it("eliminar reserva admin (pasada) NO llama liberarSlotYNotificar", async () => {
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    const pasada = new Date()
    pasada.setDate(pasada.getDate() - 1)
    mockDb.booking.findUnique.mockResolvedValue(crearReservaMock({
      startTime: pasada,
      endTime: new Date(pasada.getTime() + 90 * 60000),
    }))
    mockDb.booking.delete.mockResolvedValue({})

    await adminBookingDELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ bookingId: "booking-old" })
    )

    expect(mockLiberarSlot).not.toHaveBeenCalled()
  })

  it("crear reserva jugador llama limpiarWaitlistAlReservar con courtId + startTime + userId", async () => {
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.findFirst.mockResolvedValue(null) // sin overlap
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.booking.create.mockResolvedValue(crearReservaMock({ id: "new" }))

    await playerBookingPOST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(mockLimpiarWaitlist).toHaveBeenCalledWith(
      expect.objectContaining({
        courtId: "court-1",
        userId: "user-1",
      })
    )
  })

  it("reagendar llama liberarSlotYNotificar para slot original + limpiarWaitlistAlReservar para nuevo", async () => {
    mockRequireAuth.mockResolvedValue(crearSesionMock())
    const original = crearReservaMock({ court: { name: "Pista 1" } })
    mockDb.booking.findFirst
      .mockResolvedValueOnce(original) // original
      .mockResolvedValueOnce(null) // overlap check
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    const nueva = crearReservaMock({ id: "new-b" })
    mockDb.$transaction.mockResolvedValue([{}, nueva])

    await reschedule(
      crearRequest({
        method: "PATCH",
        body: {
          newStartTime: manana(14, 0).toISOString(),
          newEndTime: manana(15, 30).toISOString(),
        },
      }),
      crearParams({ bookingId: "booking-1" })
    )

    expect(mockLiberarSlot).toHaveBeenCalled()
    expect(mockLimpiarWaitlist).toHaveBeenCalled()
  })

  it("cron auto-cancel llama liberarSlotYNotificar por cada cancelada", async () => {
    process.env.CRON_SECRET = "secret"
    mockDb.booking.findMany
      .mockResolvedValueOnce([]) // recordatorios
      .mockResolvedValueOnce([
        { id: "b1", courtId: "c1", startTime: new Date(), endTime: new Date(), clubId: "cl", court: { name: "P" }, club: { slug: "s", name: "N" } },
        { id: "b2", courtId: "c2", startTime: new Date(), endTime: new Date(), clubId: "cl", court: { name: "P2" }, club: { slug: "s", name: "N" } },
      ])

    await cronPOST(new Request("http://localhost/api/cron/booking-reminders", {
      method: "POST",
      headers: { authorization: "Bearer secret" },
    }))

    expect(mockLiberarSlot).toHaveBeenCalledTimes(2)
  })

  it("crear partida abierta llama limpiarWaitlistAlReservar", async () => {
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.findFirst.mockResolvedValue(null)
    mockDb.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }])
    mockDb.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") return (cb as (db: typeof mockDb) => Promise<unknown>)(mockDb)
      return cb
    })
    mockDb.booking.create.mockResolvedValue({ id: "bp" })
    mockDb.openMatch.create.mockResolvedValue({ id: "m1" })
    mockDb.openMatchPlayer.createMany.mockResolvedValue({})

    await openMatchPOST(crearRequest({
      body: {
        courtId: "court-1",
        matchTime: manana(10, 0).toISOString(),
        playerIds: ["u1", "u2"],
      },
    }))

    expect(mockLimpiarWaitlist).toHaveBeenCalled()
  })

  it("PATCH partida con cambio slot llama liberar + limpiar", async () => {
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.openMatch.findFirst.mockResolvedValue(crearPartidaMock())
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock({ id: "court-2" }))
    mockDb.club.findUnique.mockResolvedValue(crearClubMock())
    mockDb.booking.findFirst.mockResolvedValue(null) // sin overlap
    mockDb.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }])
    mockDb.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") return (cb as (db: typeof mockDb) => Promise<unknown>)(mockDb)
      return cb
    })
    mockDb.openMatch.update.mockResolvedValue({})
    mockDb.booking.update.mockResolvedValue({})
    mockDb.openMatchPlayer.deleteMany.mockResolvedValue({})
    mockDb.openMatchPlayer.createMany.mockResolvedValue({})

    await openMatchPATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-2", // diferente al original
          matchTime: manana(10, 0).toISOString(),
          playerIds: ["u1", "u2"],
        },
      }),
      crearParamsPlano({ matchId: "match-1" })
    )

    expect(mockLiberarSlot).toHaveBeenCalled()
    expect(mockLimpiarWaitlist).toHaveBeenCalled()
  })
})
