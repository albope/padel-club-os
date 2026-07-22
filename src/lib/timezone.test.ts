import { describe, it, expect } from "vitest"
import {
  partesEnZonaClub,
  horaDecimalEnZonaClub,
  diaSemanaEnZonaClub,
  instanteDesdeZonaClub,
  inicioDiaEnZonaClub,
} from "./timezone"

// Estos tests usan instantes UTC explicitos ("Z") para ser deterministas
// en cualquier zona horaria (CI corre en UTC, dev local en CET/CEST).

describe("partesEnZonaClub", () => {
  it("convierte un instante de verano (CEST, UTC+2)", () => {
    // 16:00 UTC en julio = 18:00 en Madrid
    const p = partesEnZonaClub(new Date("2026-07-20T16:00:00Z"))
    expect(p).toMatchObject({ year: 2026, month: 7, day: 20, hour: 18, minute: 0 })
  })

  it("convierte un instante de invierno (CET, UTC+1)", () => {
    // 16:00 UTC en enero = 17:00 en Madrid
    const p = partesEnZonaClub(new Date("2026-01-19T16:00:00Z"))
    expect(p).toMatchObject({ year: 2026, month: 1, day: 19, hour: 17, minute: 0 })
  })

  it("cruza la medianoche del club correctamente", () => {
    // 23:30 UTC del dia 20 en julio = 01:30 del dia 21 en Madrid
    const p = partesEnZonaClub(new Date("2026-07-20T23:30:00Z"))
    expect(p).toMatchObject({ year: 2026, month: 7, day: 21, hour: 1, minute: 30 })
  })
})

describe("horaDecimalEnZonaClub", () => {
  it("devuelve hora decimal en hora de pared del club", () => {
    expect(horaDecimalEnZonaClub(new Date("2026-07-20T16:30:00Z"))).toBe(18.5)
    expect(horaDecimalEnZonaClub(new Date("2026-01-19T09:00:00Z"))).toBe(10)
  })
})

describe("diaSemanaEnZonaClub", () => {
  it("usa el calendario del club, no el del servidor", () => {
    // 2026-07-20 es lunes; a las 23:00 UTC en Madrid ya es martes 21
    expect(diaSemanaEnZonaClub(new Date("2026-07-20T12:00:00Z"))).toBe(1) // lunes
    expect(diaSemanaEnZonaClub(new Date("2026-07-20T23:00:00Z"))).toBe(2) // martes en Madrid
    expect(diaSemanaEnZonaClub(new Date("2026-07-19T10:00:00Z"))).toBe(0) // domingo
  })
})

describe("instanteDesdeZonaClub", () => {
  it("construye el instante correcto en verano (CEST)", () => {
    // 18:00 Madrid en julio = 16:00 UTC
    const d = instanteDesdeZonaClub(2026, 7, 20, 18, 0)
    expect(d.toISOString()).toBe("2026-07-20T16:00:00.000Z")
  })

  it("construye el instante correcto en invierno (CET)", () => {
    // 18:00 Madrid en enero = 17:00 UTC
    const d = instanteDesdeZonaClub(2026, 1, 19, 18, 0)
    expect(d.toISOString()).toBe("2026-01-19T17:00:00.000Z")
  })

  it("es inversa de partesEnZonaClub (round-trip)", () => {
    const d = instanteDesdeZonaClub(2026, 3, 28, 10, 30)
    expect(partesEnZonaClub(d)).toMatchObject({
      year: 2026,
      month: 3,
      day: 28,
      hour: 10,
      minute: 30,
    })
  })

  it("normaliza componentes fuera de rango (aritmetica de dias)", () => {
    // 20 de julio + 15 dias = 4 de agosto
    const d = instanteDesdeZonaClub(2026, 7, 20 + 15, 9, 0)
    expect(partesEnZonaClub(d)).toMatchObject({ month: 8, day: 4, hour: 9 })
  })
})

describe("inicioDiaEnZonaClub", () => {
  it("devuelve las 00:00 del club para una fecha YYYY-MM-DD", () => {
    // Medianoche de Madrid en julio = 22:00 UTC del dia anterior
    expect(inicioDiaEnZonaClub("2026-07-22").toISOString()).toBe("2026-07-21T22:00:00.000Z")
    // En invierno = 23:00 UTC del dia anterior
    expect(inicioDiaEnZonaClub("2026-01-15").toISOString()).toBe("2026-01-14T23:00:00.000Z")
  })
})
