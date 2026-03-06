import { describe, it, expect } from "vitest"
import {
  parsearFecha,
  parsearHora,
  construirDatetime,
  dedupReservasCSV,
  mapearEstadoPago,
  esEstadoPagoValido,
  type ReservaImportada,
} from "./import-bookings"

// --- parsearFecha ---
describe("parsearFecha", () => {
  it("parsea formato ISO YYYY-MM-DD", () => {
    const date = parsearFecha("2026-04-15")
    expect(date).not.toBeNull()
    expect(date!.getFullYear()).toBe(2026)
    expect(date!.getMonth()).toBe(3) // abril = 3
    expect(date!.getDate()).toBe(15)
  })

  it("parsea formato espanol DD/MM/YYYY", () => {
    const date = parsearFecha("15/04/2026")
    expect(date).not.toBeNull()
    expect(date!.getFullYear()).toBe(2026)
    expect(date!.getMonth()).toBe(3)
    expect(date!.getDate()).toBe(15)
  })

  it("parsea formato espanol con un digito D/M/YYYY", () => {
    const date = parsearFecha("5/4/2026")
    expect(date).not.toBeNull()
    expect(date!.getDate()).toBe(5)
    expect(date!.getMonth()).toBe(3)
  })

  it("retorna null para fecha vacia", () => {
    expect(parsearFecha("")).toBeNull()
    expect(parsearFecha("  ")).toBeNull()
  })

  it("retorna null para formato invalido", () => {
    expect(parsearFecha("15-04-2026")).toBeNull()
    expect(parsearFecha("2026/04/15")).toBeNull()
    expect(parsearFecha("abc")).toBeNull()
  })

  it("retorna null para fecha desbordada", () => {
    expect(parsearFecha("2026-13-01")).toBeNull() // mes 13
    expect(parsearFecha("2026-02-30")).toBeNull() // 30 feb
    expect(parsearFecha("31/02/2026")).toBeNull() // 31 feb
  })

  it("retorna null para dia 0", () => {
    expect(parsearFecha("2026-04-00")).toBeNull()
    expect(parsearFecha("00/04/2026")).toBeNull()
  })
})

// --- parsearHora ---
describe("parsearHora", () => {
  it("parsea hora valida HH:MM", () => {
    expect(parsearHora("09:00")).toEqual({ hour: 9, minute: 0 })
    expect(parsearHora("18:30")).toEqual({ hour: 18, minute: 30 })
    expect(parsearHora("0:00")).toEqual({ hour: 0, minute: 0 })
    expect(parsearHora("23:59")).toEqual({ hour: 23, minute: 59 })
  })

  it("retorna null para hora fuera de rango", () => {
    expect(parsearHora("24:00")).toBeNull()
    expect(parsearHora("25:00")).toBeNull()
  })

  it("retorna null para minuto fuera de rango", () => {
    expect(parsearHora("09:60")).toBeNull()
  })

  it("retorna null para formato invalido", () => {
    expect(parsearHora("9")).toBeNull()
    expect(parsearHora("09:0")).toBeNull()
    expect(parsearHora("abc")).toBeNull()
    expect(parsearHora("")).toBeNull()
  })
})

// --- construirDatetime ---
describe("construirDatetime", () => {
  it("combina fecha y hora correctamente", () => {
    const fecha = new Date(2026, 3, 15) // 15 abril 2026
    const dt = construirDatetime(fecha, { hour: 9, minute: 30 })
    expect(dt.getFullYear()).toBe(2026)
    expect(dt.getMonth()).toBe(3)
    expect(dt.getDate()).toBe(15)
    expect(dt.getHours()).toBe(9)
    expect(dt.getMinutes()).toBe(30)
    expect(dt.getSeconds()).toBe(0)
  })

  it("no muta la fecha original", () => {
    const fecha = new Date(2026, 3, 15)
    const originalHours = fecha.getHours()
    construirDatetime(fecha, { hour: 18, minute: 0 })
    expect(fecha.getHours()).toBe(originalHours)
  })
})

// --- dedupReservasCSV ---
describe("dedupReservasCSV", () => {
  const makeReserva = (pista: string, fecha: string, horaInicio: string, fila: number): ReservaImportada => ({
    pista,
    fecha,
    horaInicio,
    horaFin: "10:30",
    fila,
  })

  it("primera ocurrencia gana, segunda va a errors", () => {
    const reservas = [
      makeReserva("Pista 1", "15/04/2026", "09:00", 2),
      makeReserva("Pista 1", "15/04/2026", "09:00", 3),
    ]
    const { unicas, errors } = dedupReservasCSV(reservas)

    expect(unicas).toHaveLength(1)
    expect(unicas[0].fila).toBe(2)
    expect(errors).toHaveLength(1)
    expect(errors[0].fila).toBe(3)
  })

  it("dedup case-insensitive en nombre pista", () => {
    const reservas = [
      makeReserva("Pista 1", "15/04/2026", "09:00", 2),
      makeReserva("pista 1", "15/04/2026", "09:00", 3),
    ]
    const { unicas, errors } = dedupReservasCSV(reservas)

    expect(unicas).toHaveLength(1)
    expect(errors).toHaveLength(1)
  })

  it("misma pista distinta hora no es duplicado", () => {
    const reservas = [
      makeReserva("Pista 1", "15/04/2026", "09:00", 2),
      makeReserva("Pista 1", "15/04/2026", "10:30", 3),
    ]
    const { unicas, errors } = dedupReservasCSV(reservas)

    expect(unicas).toHaveLength(2)
    expect(errors).toHaveLength(0)
  })

  it("misma pista distinta fecha no es duplicado", () => {
    const reservas = [
      makeReserva("Pista 1", "15/04/2026", "09:00", 2),
      makeReserva("Pista 1", "16/04/2026", "09:00", 3),
    ]
    const { unicas, errors } = dedupReservasCSV(reservas)

    expect(unicas).toHaveLength(2)
    expect(errors).toHaveLength(0)
  })

  it("lista vacia retorna vacio", () => {
    const { unicas, errors } = dedupReservasCSV([])
    expect(unicas).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })
})

// --- mapearEstadoPago ---
describe("mapearEstadoPago", () => {
  it("mapea estados validos", () => {
    expect(mapearEstadoPago("pendiente")).toBe("pending")
    expect(mapearEstadoPago("pagado")).toBe("paid")
    expect(mapearEstadoPago("exento")).toBe("exempt")
  })

  it("es case-insensitive", () => {
    expect(mapearEstadoPago("PAGADO")).toBe("paid")
    expect(mapearEstadoPago("Pendiente")).toBe("pending")
  })

  it("devuelve exempt por defecto para vacio o undefined", () => {
    expect(mapearEstadoPago("")).toBe("exempt")
    expect(mapearEstadoPago(undefined)).toBe("exempt")
  })

  it("devuelve exempt para valor desconocido", () => {
    expect(mapearEstadoPago("otro")).toBe("exempt")
  })
})

// --- esEstadoPagoValido ---
describe("esEstadoPagoValido", () => {
  it("acepta estados validos", () => {
    expect(esEstadoPagoValido("pendiente")).toBe(true)
    expect(esEstadoPagoValido("pagado")).toBe(true)
    expect(esEstadoPagoValido("exento")).toBe(true)
  })

  it("rechaza estados invalidos", () => {
    expect(esEstadoPagoValido("otro")).toBe(false)
    expect(esEstadoPagoValido("paid")).toBe(false)
  })
})
