import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"

vi.mock("@/lib/db", () => ({ db: mockDb }))

import { calcularPrecioReserva, obtenerPreciosPista } from "./pricing"

describe("calcularPrecioReserva", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna el precio si hay regla configurada", async () => {
    mockDb.courtPricing.findFirst.mockResolvedValue({
      id: "1",
      courtId: "court-1",
      clubId: "club-1",
      dayOfWeek: 1, // Lunes
      startHour: 10,
      endHour: 12,
      price: 25.0,
    })

    // Lunes 15 enero 2024, 10:00 local
    const startTime = new Date(2024, 0, 15, 10, 0) // Lunes
    const endTime = new Date(2024, 0, 15, 11, 30)

    const precio = await calcularPrecioReserva("court-1", "club-1", startTime, endTime)
    expect(precio).toBe(25.0)
  })

  it("retorna 0 si no hay regla de precio configurada", async () => {
    mockDb.courtPricing.findFirst.mockResolvedValue(null)

    const startTime = new Date(2024, 0, 15, 10, 0)
    const endTime = new Date(2024, 0, 15, 11, 30)

    const precio = await calcularPrecioReserva("court-1", "club-1", startTime, endTime)
    expect(precio).toBe(0)
  })

  it("pasa dayOfWeek y startHour correctos a la query", async () => {
    mockDb.courtPricing.findFirst.mockResolvedValue(null)

    // Miercoles = getDay() 3, hora 14
    const startTime = new Date(2024, 0, 17, 14, 0) // Miercoles
    const endTime = new Date(2024, 0, 17, 15, 30)

    await calcularPrecioReserva("court-1", "club-1", startTime, endTime)

    expect(mockDb.courtPricing.findFirst).toHaveBeenCalledWith({
      where: {
        courtId: "court-1",
        clubId: "club-1",
        dayOfWeek: 3,
        startHour: { lte: 14 },
        endHour: { gt: 14 },
      },
    })
  })

  it("maneja domingo (dayOfWeek 0)", async () => {
    mockDb.courtPricing.findFirst.mockResolvedValue({
      price: 30.0,
    })

    // Domingo 14 enero 2024
    const startTime = new Date(2024, 0, 14, 9, 0)
    const endTime = new Date(2024, 0, 14, 10, 30)

    const precio = await calcularPrecioReserva("court-1", "club-1", startTime, endTime)
    expect(precio).toBe(30.0)

    expect(mockDb.courtPricing.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dayOfWeek: 0 }),
      })
    )
  })
})

describe("obtenerPreciosPista", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna array de precios ordenados por hora", async () => {
    const precios = [
      { startHour: 9, endHour: 14, price: 20 },
      { startHour: 14, endHour: 20, price: 30 },
      { startHour: 20, endHour: 23, price: 25 },
    ]
    mockDb.courtPricing.findMany.mockResolvedValue(precios)

    const resultado = await obtenerPreciosPista("court-1", "club-1", 1)
    expect(resultado).toHaveLength(3)
    expect(resultado[0].startHour).toBe(9)
    expect(resultado[1].startHour).toBe(14)
    expect(resultado[2].price).toBe(25)
  })

  it("retorna array vacio si no hay precios configurados", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([])

    const resultado = await obtenerPreciosPista("court-1", "club-1", 6)
    expect(resultado).toEqual([])
  })

  it("pasa parametros correctos a la query", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([])

    await obtenerPreciosPista("court-x", "club-y", 5)

    expect(mockDb.courtPricing.findMany).toHaveBeenCalledWith({
      where: {
        courtId: "court-x",
        clubId: "club-y",
        dayOfWeek: 5,
      },
      orderBy: { startHour: "asc" },
      select: {
        startHour: true,
        endHour: true,
        price: true,
      },
    })
  })
})
