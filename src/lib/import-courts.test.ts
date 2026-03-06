import { describe, it, expect } from "vitest"
import {
  normalizarNombre,
  parsearHeaderPricing,
  parsearHeadersPricing,
  parsearPrecio,
  dedupPistasCSV,
  dedupPreciosIntraPista,
  type PistaImportada,
  type PricingRule,
} from "./import-courts"

// --- normalizarNombre ---
describe("normalizarNombre", () => {
  it("trim + collapse spaces + lowercase", () => {
    expect(normalizarNombre("  Pista   1  ")).toBe("pista 1")
  })

  it("case-insensitive", () => {
    expect(normalizarNombre("PISTA 1")).toBe("pista 1")
    expect(normalizarNombre("Pista 1")).toBe("pista 1")
  })

  it("preserva caracteres especiales", () => {
    expect(normalizarNombre("Pista ñoño")).toBe("pista ñoño")
  })
})

// --- parsearHeaderPricing ---
describe("parsearHeaderPricing", () => {
  it("parsea header valido: lunes_9-14", () => {
    expect(parsearHeaderPricing("lunes_9-14")).toEqual({
      dayOfWeek: 1,
      startHour: 9,
      endHour: 14,
    })
  })

  it("parsea dia con tilde: miércoles_10-18", () => {
    expect(parsearHeaderPricing("miércoles_10-18")).toEqual({
      dayOfWeek: 3,
      startHour: 10,
      endHour: 18,
    })
  })

  it("parsea dia sin tilde: sabado_9-14", () => {
    expect(parsearHeaderPricing("sabado_9-14")).toEqual({
      dayOfWeek: 6,
      startHour: 9,
      endHour: 14,
    })
  })

  it("parsea domingo_8-22", () => {
    expect(parsearHeaderPricing("domingo_8-22")).toEqual({
      dayOfWeek: 0,
      startHour: 8,
      endHour: 22,
    })
  })

  it("retorna null para dia no valido", () => {
    expect(parsearHeaderPricing("foo_9-14")).toBeNull()
  })

  it("retorna null para startHour >= endHour", () => {
    expect(parsearHeaderPricing("lunes_14-9")).toBeNull()
    expect(parsearHeaderPricing("lunes_14-14")).toBeNull()
  })

  it("retorna null para horas fuera de rango", () => {
    expect(parsearHeaderPricing("lunes_25-30")).toBeNull()
    expect(parsearHeaderPricing("lunes_0-25")).toBeNull()
  })

  it("retorna null para formato incorrecto", () => {
    expect(parsearHeaderPricing("lunes_9")).toBeNull()
    expect(parsearHeaderPricing("lunes")).toBeNull()
    expect(parsearHeaderPricing("9-14")).toBeNull()
    expect(parsearHeaderPricing("")).toBeNull()
  })

  it("acepta endHour 24 (medianoche)", () => {
    expect(parsearHeaderPricing("viernes_20-24")).toEqual({
      dayOfWeek: 5,
      startHour: 20,
      endHour: 24,
    })
  })

  it("acepta startHour 0", () => {
    expect(parsearHeaderPricing("lunes_0-8")).toEqual({
      dayOfWeek: 1,
      startHour: 0,
      endHour: 8,
    })
  })
})

// --- parsearHeadersPricing ---
describe("parsearHeadersPricing", () => {
  it("detecta columnas pricing e ignora nombre/tipo", () => {
    const headers = ["nombre", "tipo", "lunes_9-14", "martes_14-21"]
    const { mappings, errors } = parsearHeadersPricing(headers)

    expect(errors).toHaveLength(0)
    expect(mappings).toHaveLength(2)
    expect(mappings[0]).toMatchObject({ columnIndex: 2, dayOfWeek: 1, startHour: 9, endHour: 14 })
    expect(mappings[1]).toMatchObject({ columnIndex: 3, dayOfWeek: 2, startHour: 14, endHour: 21 })
  })

  it("reporta error para columna pricing invalida", () => {
    const headers = ["nombre", "foo_9-14"]
    const { mappings, errors } = parsearHeadersPricing(headers)

    expect(mappings).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain("foo_9-14")
  })

  it("ignora columnas que no parecen pricing", () => {
    const headers = ["nombre", "tipo", "extra_columna"]
    const { mappings, errors } = parsearHeadersPricing(headers)

    expect(mappings).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })
})

// --- parsearPrecio ---
describe("parsearPrecio", () => {
  it("parsea entero", () => {
    expect(parsearPrecio("20")).toBe(20)
  })

  it("parsea punto decimal", () => {
    expect(parsearPrecio("20.5")).toBe(20.5)
  })

  it("parsea coma decimal espanola", () => {
    expect(parsearPrecio("20,5")).toBe(20.5)
  })

  it("retorna null para celda vacia", () => {
    expect(parsearPrecio("")).toBeNull()
    expect(parsearPrecio("  ")).toBeNull()
  })

  it("retorna null para texto no numerico", () => {
    expect(parsearPrecio("abc")).toBeNull()
  })

  it("parsea cero", () => {
    expect(parsearPrecio("0")).toBe(0)
  })

  it("parsea negativos", () => {
    expect(parsearPrecio("-5")).toBe(-5)
  })
})

// --- dedupPistasCSV ---
describe("dedupPistasCSV", () => {
  const makePista = (nombre: string, fila: number): PistaImportada => ({
    nombre,
    tipo: "Cristal",
    precios: [],
    fila,
  })

  it("primera ocurrencia gana, segunda va a errors", () => {
    const pistas = [makePista("Pista 1", 2), makePista("Pista 1", 3)]
    const { unicas, errors } = dedupPistasCSV(pistas)

    expect(unicas).toHaveLength(1)
    expect(unicas[0].fila).toBe(2)
    expect(errors).toHaveLength(1)
    expect(errors[0].fila).toBe(3)
    expect(errors[0].campo).toBe("nombre")
  })

  it("dedup case-insensitive", () => {
    const pistas = [makePista("Pista 1", 2), makePista("pista 1", 3)]
    const { unicas, errors } = dedupPistasCSV(pistas)

    expect(unicas).toHaveLength(1)
    expect(errors).toHaveLength(1)
  })

  it("dedup con espacios extra", () => {
    const pistas = [makePista("Pista 1", 2), makePista("  Pista   1  ", 3)]
    const { unicas, errors } = dedupPistasCSV(pistas)

    expect(unicas).toHaveLength(1)
    expect(errors).toHaveLength(1)
  })

  it("no dedup nombres diferentes", () => {
    const pistas = [makePista("Pista 1", 2), makePista("Pista 2", 3)]
    const { unicas, errors } = dedupPistasCSV(pistas)

    expect(unicas).toHaveLength(2)
    expect(errors).toHaveLength(0)
  })

  it("lista vacia retorna vacio", () => {
    const { unicas, errors } = dedupPistasCSV([])

    expect(unicas).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })
})

// --- dedupPreciosIntraPista ---
describe("dedupPreciosIntraPista", () => {
  it("ultima gana para mismo dia+hora", () => {
    const precios: PricingRule[] = [
      { dayOfWeek: 1, startHour: 9, endHour: 14, price: 20 },
      { dayOfWeek: 1, startHour: 9, endHour: 14, price: 25 },
    ]
    const result = dedupPreciosIntraPista(precios)

    expect(result).toHaveLength(1)
    expect(result[0].price).toBe(25)
  })

  it("mantiene precios de slots distintos", () => {
    const precios: PricingRule[] = [
      { dayOfWeek: 1, startHour: 9, endHour: 14, price: 20 },
      { dayOfWeek: 1, startHour: 14, endHour: 21, price: 30 },
      { dayOfWeek: 2, startHour: 9, endHour: 14, price: 22 },
    ]
    const result = dedupPreciosIntraPista(precios)

    expect(result).toHaveLength(3)
  })

  it("lista vacia retorna vacio", () => {
    expect(dedupPreciosIntraPista([])).toHaveLength(0)
  })
})
