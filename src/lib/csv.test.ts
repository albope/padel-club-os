import { describe, it, expect } from "vitest"
import { escaparCSV, generarCSV, formatearFechaCSV, formatearHoraCSV } from "./csv"

describe("escaparCSV", () => {
  it("retorna valor sin cambios si no tiene caracteres especiales", () => {
    expect(escaparCSV("hola")).toBe("hola")
  })

  it("retorna cadena vacia sin cambios", () => {
    expect(escaparCSV("")).toBe("")
  })

  it("envuelve en comillas si contiene comas", () => {
    expect(escaparCSV("hola,mundo")).toBe('"hola,mundo"')
  })

  it("envuelve en comillas y duplica comillas internas", () => {
    expect(escaparCSV('dice "hola"')).toBe('"dice ""hola"""')
  })

  it("envuelve en comillas si contiene salto de linea", () => {
    expect(escaparCSV("linea1\nlinea2")).toBe('"linea1\nlinea2"')
  })

  it("maneja combinacion de coma, comilla y salto de linea", () => {
    const valor = 'a,b"c\nd'
    const resultado = escaparCSV(valor)
    expect(resultado).toBe('"a,b""c\nd"')
  })

  it("no envuelve si solo tiene espacios", () => {
    expect(escaparCSV("  hola  ")).toBe("  hola  ")
  })
})

describe("generarCSV", () => {
  it("empieza con BOM UTF-8", () => {
    const csv = generarCSV(["A"], [])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it("genera solo cabeceras si no hay filas", () => {
    const csv = generarCSV(["Nombre", "Email"], [])
    expect(csv).toBe("\uFEFFNombre,Email")
  })

  it("genera cabeceras y filas correctamente", () => {
    const csv = generarCSV(
      ["Nombre", "Email"],
      [
        ["Juan", "juan@test.com"],
        ["Ana", "ana@test.com"],
      ]
    )
    expect(csv).toBe("\uFEFFNombre,Email\nJuan,juan@test.com\nAna,ana@test.com")
  })

  it("escapa valores con comas en las filas", () => {
    const csv = generarCSV(["Nombre"], [["Garcia, Juan"]])
    expect(csv).toBe('\uFEFFNombre\n"Garcia, Juan"')
  })

  it("escapa cabeceras con caracteres especiales", () => {
    const csv = generarCSV(['Nombre "completo"'], [["test"]])
    expect(csv).toBe('\uFEFF"Nombre ""completo"""\ntest')
  })
})

describe("formatearFechaCSV", () => {
  it("formatea fecha como DD/MM/YYYY", () => {
    // 15 marzo 2024 a las 12:00 UTC (13:00 en Madrid, mismo dia)
    const fecha = new Date("2024-03-15T12:00:00Z")
    expect(formatearFechaCSV(fecha)).toBe("15/03/2024")
  })

  it("formatea primer dia del anio", () => {
    const fecha = new Date("2024-01-01T12:00:00Z")
    expect(formatearFechaCSV(fecha)).toBe("01/01/2024")
  })

  it("formatea ultimo dia del anio", () => {
    const fecha = new Date("2024-12-31T12:00:00Z")
    expect(formatearFechaCSV(fecha)).toBe("31/12/2024")
  })
})

describe("formatearHoraCSV", () => {
  it("formatea hora como HH:MM en formato 24h", () => {
    // 14:30 UTC = 15:30 en Madrid (horario de invierno CET = UTC+1)
    const fecha = new Date("2024-01-15T14:30:00Z")
    expect(formatearHoraCSV(fecha)).toBe("15:30")
  })

  it("formatea hora de la manana", () => {
    // 08:00 UTC = 09:00 en Madrid (CET)
    const fecha = new Date("2024-01-15T08:00:00Z")
    expect(formatearHoraCSV(fecha)).toBe("09:00")
  })

  it("formatea medianoche UTC como 01:00 en Madrid (CET)", () => {
    const fecha = new Date("2024-01-15T00:00:00Z")
    expect(formatearHoraCSV(fecha)).toBe("01:00")
  })
})
