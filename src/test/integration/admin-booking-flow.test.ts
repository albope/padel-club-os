/**
 * Tests de integracion para flujos de reserva admin:
 * POST /api/bookings (crear), PATCH/DELETE /api/bookings/[bookingId]
 * Cubre: creacion guest/socio, aislamiento club, auth, subscription, overlap, waitlist.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearClubMock, crearPistaMock, crearReservaMock, crearSesionAdminMock, manana } from "@/test/factories"
import { crearRequest, crearParamsPlano, extraerJson } from "@/test/helpers/api-route"

// --- Mocks ---
const mockRequireAuth = vi.fn()
const mockLimpiarWaitlist = vi.fn().mockResolvedValue(undefined)
const mockLiberarSlot = vi.fn().mockResolvedValue(undefined)

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
vi.mock("@/lib/waitlist", () => ({
  limpiarWaitlistAlReservar: (...args: unknown[]) => mockLimpiarWaitlist(...args),
  liberarSlotYNotificar: (...args: unknown[]) => mockLiberarSlot(...args),
}))
vi.mock("@/lib/court-blocks", () => ({
  verificarBloqueo: vi.fn().mockResolvedValue(null),
}))

import { GET, POST } from "@/app/api/bookings/route"
import { PATCH, DELETE } from "@/app/api/bookings/[bookingId]/route"

// =============================================================================
// POST /api/bookings - Crear reserva (admin)
// =============================================================================
describe("POST /api/bookings (Crear reserva admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.booking.findFirst.mockResolvedValue(null) // sin overlap
    mockDb.booking.create.mockResolvedValue(crearReservaMock({ id: "new-admin-booking" }))
  })

  it("crea reserva para socio con paymentStatus exempt", async () => {
    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        userId: "user-1",
      },
    }))

    expect(response.status).toBe(201)
    expect(mockDb.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courtId: "court-1",
          userId: "user-1",
          paymentStatus: "exempt",
          paymentMethod: "exempt",
          status: "confirmed",
          clubId: "club-1",
        }),
      })
    )
  })

  it("crea reserva para invitado (guestName sin userId)", async () => {
    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        guestName: "Carlos Perez",
      },
    }))

    expect(response.status).toBe(201)
    expect(mockDb.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: null,
          guestName: "Carlos Perez",
        }),
      })
    )
  })

  it("crea reserva con numPlayers custom (2 jugadores)", async () => {
    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        userId: "user-1",
        numPlayers: 2,
      },
    }))

    expect(mockDb.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ numPlayers: 2 }),
      })
    )
  })

  it("numPlayers default es 4 si no se especifica", async () => {
    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        userId: "user-1",
      },
    }))

    expect(mockDb.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ numPlayers: 4 }),
      })
    )
  })

  it("rechaza sin userId ni guestName (validacion Zod refine)", async () => {
    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
      },
    }))

    expect(response.status).toBe(400)
  })

  it("rechaza si pista no pertenece al club (aislamiento)", async () => {
    mockDb.court.findFirst.mockResolvedValue(null) // no encuentra con clubId del admin

    const response = await POST(crearRequest({
      body: {
        courtId: "court-otro-club",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        userId: "user-1",
      },
    }))

    expect(response.status).toBe(404)
    expect(mockDb.court.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clubId: "club-1" }),
      })
    )
  })

  it("rechaza si hay solapamiento con otra reserva", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock()) // overlap encontrado

    const response = await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        userId: "user-1",
      },
    }))

    expect(response.status).toBe(409)
  })

  it("overlap check excluye reservas canceladas", async () => {
    // overlap query filtra status != cancelled
    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        userId: "user-1",
      },
    }))

    expect(mockDb.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: "cancelled" },
        }),
      })
    )
  })

  it("requiere permiso bookings:create con suscripcion", async () => {
    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        userId: "user-1",
      },
    }))

    expect(mockRequireAuth).toHaveBeenCalledWith(
      "bookings:create",
      expect.objectContaining({ requireSubscription: true })
    )
  })

  it("llama a limpiarWaitlistAlReservar tras crear reserva", async () => {
    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(10, 0).toISOString(),
        endTime: manana(11, 30).toISOString(),
        userId: "user-1",
      },
    }))

    expect(mockLimpiarWaitlist).toHaveBeenCalledWith(
      expect.objectContaining({
        courtId: "court-1",
        userId: "user-1",
      })
    )
  })

  it("calcula precio dinamico para la reserva", async () => {
    const { calcularPrecioReserva } = await import("@/lib/pricing")

    await POST(crearRequest({
      body: {
        courtId: "court-1",
        startTime: manana(14, 0).toISOString(),
        endTime: manana(15, 30).toISOString(),
        userId: "user-1",
      },
    }))

    expect(calcularPrecioReserva).toHaveBeenCalledWith(
      "court-1",
      "club-1",
      expect.any(Date),
      expect.any(Date)
    )
  })
})

// =============================================================================
// GET /api/bookings
// =============================================================================
describe("GET /api/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.booking.findMany.mockResolvedValue([crearReservaMock()])
  })

  it("filtra reservas por clubId del admin", async () => {
    await GET()

    expect(mockDb.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clubId: "club-1" },
      })
    )
  })

  it("requiere permiso bookings:read", async () => {
    await GET()
    expect(mockRequireAuth).toHaveBeenCalledWith("bookings:read")
  })
})

// =============================================================================
// DELETE /api/bookings/[bookingId] - Eliminar reserva (admin)
// =============================================================================
describe("DELETE /api/bookings/[bookingId] (Eliminar admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.booking.findUnique.mockResolvedValue(crearReservaMock({
      status: "confirmed",
      courtId: "court-1",
      startTime: manana(10, 0),
      endTime: manana(11, 30),
      court: { name: "Pista 1" },
      club: { slug: "club-test", name: "Club Test" },
    }))
    mockDb.booking.update.mockResolvedValue(crearReservaMock({ status: "cancelled" }))
  })

  it("cancela reserva correctamente (soft delete) → 204", async () => {
    const response = await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ bookingId: "booking-1" }),
    )

    expect(response.status).toBe(204)
    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "booking-1",
          clubId: "club-1",
        }),
        data: expect.objectContaining({
          status: "cancelled",
          cancelReason: "Eliminada por administrador",
        }),
      })
    )
  })

  it("aislamiento: update filtra por clubId del admin", async () => {
    await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ bookingId: "booking-otro-club" }),
    )

    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clubId: "club-1" }),
      })
    )
  })

  it("libera slot en waitlist si reserva es futura", async () => {
    await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ bookingId: "booking-1" }),
    )

    expect(mockLiberarSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        courtId: "court-1",
        clubId: "club-1",
      })
    )
  })

  it("NO libera slot en waitlist si reserva es pasada", async () => {
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    mockDb.booking.findUnique.mockResolvedValue(crearReservaMock({
      startTime: ayer,
      court: { name: "P1" },
      club: { slug: "c", name: "C" },
    }))

    await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ bookingId: "booking-1" }),
    )

    expect(mockLiberarSlot).not.toHaveBeenCalled()
  })

  it("requiere permiso bookings:delete", async () => {
    await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ bookingId: "booking-1" }),
    )

    expect(mockRequireAuth).toHaveBeenCalledWith("bookings:delete")
  })

  it("sin bookingId → 400", async () => {
    const response = await DELETE(
      crearRequest({ method: "DELETE" }),
      crearParamsPlano({ bookingId: "" }),
    )

    expect(response.status).toBe(400)
  })
})

// =============================================================================
// PATCH /api/bookings/[bookingId] - Actualizar reserva (admin)
// =============================================================================
describe("PATCH /api/bookings/[bookingId] (Actualizar admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(crearSesionAdminMock())
    mockDb.court.findFirst.mockResolvedValue(crearPistaMock())
    mockDb.booking.findFirst.mockResolvedValue(null) // sin overlap
    mockDb.booking.update.mockResolvedValue(crearReservaMock())
  })

  it("actualiza reserva correctamente", async () => {
    const response = await PATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-1",
          startTime: manana(14, 0).toISOString(),
          endTime: manana(15, 30).toISOString(),
        },
      }),
      crearParamsPlano({ bookingId: "booking-1" }),
    )

    expect(response.status).toBe(200)
    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "booking-1",
          clubId: "club-1",
        }),
      })
    )
  })

  it("aislamiento: update filtra por clubId", async () => {
    await PATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-1",
          startTime: manana(14, 0).toISOString(),
          endTime: manana(15, 30).toISOString(),
        },
      }),
      crearParamsPlano({ bookingId: "booking-1" }),
    )

    expect(mockDb.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clubId: "club-1" }),
      })
    )
  })

  it("overlap check excluye la reserva actual (no conflicto consigo misma)", async () => {
    await PATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-1",
          startTime: manana(10, 0).toISOString(),
          endTime: manana(11, 30).toISOString(),
        },
      }),
      crearParamsPlano({ bookingId: "booking-1" }),
    )

    expect(mockDb.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: "booking-1" },
        }),
      })
    )
  })

  it("rechaza si hay overlap con otra reserva", async () => {
    mockDb.booking.findFirst.mockResolvedValue(crearReservaMock({ id: "booking-other" }))

    const response = await PATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-1",
          startTime: manana(10, 0).toISOString(),
          endTime: manana(11, 30).toISOString(),
        },
      }),
      crearParamsPlano({ bookingId: "booking-1" }),
    )

    expect(response.status).toBe(409)
  })

  it("rechaza si pista no pertenece al club", async () => {
    mockDb.court.findFirst.mockResolvedValue(null)

    const response = await PATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-otro",
          startTime: manana(10, 0).toISOString(),
          endTime: manana(11, 30).toISOString(),
        },
      }),
      crearParamsPlano({ bookingId: "booking-1" }),
    )

    expect(response.status).toBe(404)
  })

  it("requiere permiso bookings:update", async () => {
    await PATCH(
      crearRequest({
        method: "PATCH",
        body: {
          courtId: "court-1",
          startTime: manana(10, 0).toISOString(),
          endTime: manana(11, 30).toISOString(),
        },
      }),
      crearParamsPlano({ bookingId: "booking-1" }),
    )

    expect(mockRequireAuth).toHaveBeenCalledWith("bookings:update")
  })
})
