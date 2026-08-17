import { describe, it, expect } from "vitest"
import {
  crearPreferenciaRepeticion,
  esFechaISOValida,
  formatearFechaLocal,
  proximaFechaMismoDiaSemana,
} from "./fechas"

describe("formatearFechaLocal", () => {
  it("formatea con ceros a la izquierda", () => {
    expect(formatearFechaLocal(new Date(2026, 0, 5))).toBe("2026-01-05")
  })

  it("formatea fin de anio", () => {
    expect(formatearFechaLocal(new Date(2026, 11, 31))).toBe("2026-12-31")
  })
})

describe("esFechaISOValida", () => {
  it("acepta una fecha valida", () => {
    expect(esFechaISOValida("2026-07-22")).toBe(true)
  })

  it("acepta 29 de febrero en anio bisiesto", () => {
    expect(esFechaISOValida("2028-02-29")).toBe(true)
  })

  it("rechaza 29 de febrero en anio no bisiesto", () => {
    expect(esFechaISOValida("2026-02-29")).toBe(false)
  })

  it("rechaza fechas imposibles que Date normalizaria", () => {
    expect(esFechaISOValida("2026-02-31")).toBe(false)
    expect(esFechaISOValida("2026-04-31")).toBe(false)
  })

  it("rechaza formatos incorrectos", () => {
    expect(esFechaISOValida("22-07-2026")).toBe(false)
    expect(esFechaISOValida("2026-7-22")).toBe(false)
    expect(esFechaISOValida("2026-07-22T10:00")).toBe(false)
    expect(esFechaISOValida("")).toBe(false)
    expect(esFechaISOValida("hoy")).toBe(false)
  })

  it("rechaza mes 13 y dia 00", () => {
    expect(esFechaISOValida("2026-13-01")).toBe(false)
    expect(esFechaISOValida("2026-07-00")).toBe(false)
  })
})

describe("proximaFechaMismoDiaSemana", () => {
  // 2026-07-22 es miercoles; 2026-07-13 fue lunes
  it("devuelve el proximo lunes si la reserva fue en lunes", () => {
    const original = new Date(2026, 6, 13) // lunes
    const hoy = new Date(2026, 6, 22) // miercoles
    expect(proximaFechaMismoDiaSemana(original, hoy)).toBe("2026-07-27")
  })

  it("devuelve hoy si hoy cae en el mismo dia de la semana", () => {
    const original = new Date(2026, 6, 15) // miercoles
    const hoy = new Date(2026, 6, 22) // miercoles
    expect(proximaFechaMismoDiaSemana(original, hoy)).toBe("2026-07-22")
  })

  it("devuelve una fecha dentro de esta semana si el dia aun no ha pasado", () => {
    const original = new Date(2026, 6, 17) // viernes
    const hoy = new Date(2026, 6, 22) // miercoles
    expect(proximaFechaMismoDiaSemana(original, hoy)).toBe("2026-07-24")
  })

  it("cruza cambio de mes correctamente", () => {
    const original = new Date(2026, 6, 28) // martes
    const hoy = new Date(2026, 6, 30) // jueves
    expect(proximaFechaMismoDiaSemana(original, hoy)).toBe("2026-08-04")
  })

  it("cruza cambio de anio correctamente", () => {
    const original = new Date(2026, 11, 28) // lunes
    const hoy = new Date(2026, 11, 30) // miercoles
    expect(proximaFechaMismoDiaSemana(original, hoy)).toBe("2027-01-04")
  })

  it("funciona con domingo (getDay 0)", () => {
    const original = new Date(2026, 6, 19) // domingo
    const hoy = new Date(2026, 6, 22) // miercoles
    expect(proximaFechaMismoDiaSemana(original, hoy)).toBe("2026-07-26")
  })
})

describe("crearPreferenciaRepeticion", () => {
  it("conserva pista y hora en el siguiente dia equivalente", () => {
    const preferencia = crearPreferenciaRepeticion(
      "pista-central",
      new Date(2026, 6, 13, 18, 30),
      new Date(2026, 6, 22, 12, 0),
    )

    expect(preferencia).toEqual({
      fecha: "2026-07-27",
      pistaId: "pista-central",
      hora: "18:30",
    })
  })

  it("salta una semana si hoy coincide pero la hora ya ha pasado", () => {
    const preferencia = crearPreferenciaRepeticion(
      "pista-central",
      new Date(2026, 6, 15, 18, 30),
      new Date(2026, 6, 22, 20, 0),
    )

    expect(preferencia.fecha).toBe("2026-07-29")
    expect(preferencia.hora).toBe("18:30")
  })
})
