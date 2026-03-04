import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"

vi.mock("@/lib/db", () => ({ db: mockDb }))

import { calcularPrecioReserva, obtenerPreciosPista } from "./pricing"

describe("calcularPrecioReserva", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna el precio proporcional si hay regla configurada", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([
      { startHour: 10, endHour: 12, price: 25.0 },
    ])

    // Lunes 15 enero 2024, 10:00-11:30 (1.5h × 25 = 37.50)
    const startTime = new Date(2024, 0, 15, 10, 0)
    const endTime = new Date(2024, 0, 15, 11, 30)

    const precio = await calcularPrecioReserva("court-1", "club-1", startTime, endTime)
    expect(precio).toBe(37.5)
  })

  it("retorna 0 si no hay regla de precio configurada", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([])

    const startTime = new Date(2024, 0, 15, 10, 0)
    const endTime = new Date(2024, 0, 15, 11, 30)

    const precio = await calcularPrecioReserva("court-1", "club-1", startTime, endTime)
    expect(precio).toBe(0)
  })

  it("pasa dayOfWeek correcto a la query", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([])

    // Miercoles = getDay() 3
    const startTime = new Date(2024, 0, 17, 14, 0)
    const endTime = new Date(2024, 0, 17, 15, 30)

    await calcularPrecioReserva("court-1", "club-1", startTime, endTime)

    expect(mockDb.courtPricing.findMany).toHaveBeenCalledWith({
      where: {
        courtId: "court-1",
        clubId: "club-1",
        dayOfWeek: 3,
      },
      select: {
        startHour: true,
        endHour: true,
        price: true,
      },
    })
  })

  it("maneja domingo (dayOfWeek 0)", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([
      { startHour: 9, endHour: 14, price: 30.0 },
    ])

    // Domingo 14 enero 2024, 9:00-10:30 (1.5h × 30 = 45)
    const startTime = new Date(2024, 0, 14, 9, 0)
    const endTime = new Date(2024, 0, 14, 10, 30)

    const precio = await calcularPrecioReserva("court-1", "club-1", startTime, endTime)
    expect(precio).toBe(45.0)

    expect(mockDb.courtPricing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dayOfWeek: 0 }),
      })
    )
  })

  // --- Nuevos tests: duracion y cruce de franjas ---

  it("reserva 90 min dentro de una sola banda", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([
      { startHour: 10, endHour: 14, price: 20 },
    ])

    const startTime = new Date(2024, 0, 15, 10, 0)
    const endTime = new Date(2024, 0, 15, 11, 30) // 1.5h × 20 = 30

    expect(await calcularPrecioReserva("c", "cl", startTime, endTime)).toBe(30.0)
  })

  it("reserva 60 min dentro de una sola banda", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([
      { startHour: 10, endHour: 14, price: 20 },
    ])

    const startTime = new Date(2024, 0, 15, 10, 0)
    const endTime = new Date(2024, 0, 15, 11, 0) // 1h × 20 = 20

    expect(await calcularPrecioReserva("c", "cl", startTime, endTime)).toBe(20.0)
  })

  it("reserva 120 min dentro de una sola banda", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([
      { startHour: 10, endHour: 14, price: 20 },
    ])

    const startTime = new Date(2024, 0, 15, 10, 0)
    const endTime = new Date(2024, 0, 15, 12, 0) // 2h × 20 = 40

    expect(await calcularPrecioReserva("c", "cl", startTime, endTime)).toBe(40.0)
  })

  it("reserva 90 min cruzando frontera de banda", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([
      { startHour: 19, endHour: 20, price: 10 },
      { startHour: 20, endHour: 23, price: 15 },
    ])

    // 19:00-20:30: 1h×10 + 0.5h×15 = 17.50
    const startTime = new Date(2024, 0, 15, 19, 0)
    const endTime = new Date(2024, 0, 15, 20, 30)

    expect(await calcularPrecioReserva("c", "cl", startTime, endTime)).toBe(17.5)
  })

  it("inicio a :30 cruzando frontera de banda", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([
      { startHour: 10, endHour: 11, price: 20 },
      { startHour: 11, endHour: 14, price: 30 },
    ])

    // 10:30-12:00: 0.5h×20 + 1h×30 = 40
    const startTime = new Date(2024, 0, 15, 10, 30)
    const endTime = new Date(2024, 0, 15, 12, 0)

    expect(await calcularPrecioReserva("c", "cl", startTime, endTime)).toBe(40.0)
  })

  it("reserva 120 min cruzando dos fronteras de banda", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([
      { startHour: 18, endHour: 19, price: 8 },
      { startHour: 19, endHour: 21, price: 12 },
      { startHour: 21, endHour: 23, price: 10 },
    ])

    // 18:30-20:30: 0.5h×8 + 1.5h×12 = 4+18 = 22
    const startTime = new Date(2024, 0, 15, 18, 30)
    const endTime = new Date(2024, 0, 15, 20, 30)

    expect(await calcularPrecioReserva("c", "cl", startTime, endTime)).toBe(22.0)
  })

  it("retorna 0 si no hay bandas configuradas", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([])

    const startTime = new Date(2024, 0, 15, 10, 0)
    const endTime = new Date(2024, 0, 15, 11, 30)

    expect(await calcularPrecioReserva("c", "cl", startTime, endTime)).toBe(0)
  })

  it("cobertura parcial: solo cobra las horas cubiertas por bandas", async () => {
    mockDb.courtPricing.findMany.mockResolvedValue([
      { startHour: 10, endHour: 11, price: 20 },
    ])

    // 10:00-11:30: solo 1h cubierta × 20 = 20 (los 30 min sin banda = gratis)
    const startTime = new Date(2024, 0, 15, 10, 0)
    const endTime = new Date(2024, 0, 15, 11, 30)

    expect(await calcularPrecioReserva("c", "cl", startTime, endTime)).toBe(20.0)
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
