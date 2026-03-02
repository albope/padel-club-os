import { describe, it, expect, vi } from "vitest"

// Mock Resend para evitar inicializacion
vi.mock("resend", () => ({
  Resend: vi.fn(),
}))

import {
  escaparHtml,
  cajaDetalle,
  formatearFecha,
  formatearHora,
  calcularDuracionMin,
  traducirEstadoPago,
} from "./email"

describe("escaparHtml", () => {
  it("escapa ampersand", () => {
    expect(escaparHtml("A&B")).toBe("A&amp;B")
  })

  it("escapa menor que", () => {
    expect(escaparHtml("<script>")).toBe("&lt;script&gt;")
  })

  it("escapa comillas dobles", () => {
    expect(escaparHtml('dice "hola"')).toBe("dice &quot;hola&quot;")
  })

  it("escapa comillas simples", () => {
    expect(escaparHtml("it's")).toBe("it&#39;s")
  })

  it("escapa multiples caracteres combinados", () => {
    expect(escaparHtml('<img src="x" onerror="alert(1)">')).toBe(
      "&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;"
    )
  })

  it("no modifica texto sin caracteres especiales", () => {
    expect(escaparHtml("texto normal")).toBe("texto normal")
  })
})

describe("cajaDetalle", () => {
  it("genera HTML con tabla y borde azul", () => {
    const html = cajaDetalle([
      { etiqueta: "Pista", valor: "Pista 1" },
      { etiqueta: "Hora", valor: "10:00" },
    ])
    expect(html).toContain("border-left:4px solid")
    expect(html).toContain("Pista")
    expect(html).toContain("Pista 1")
    expect(html).toContain("Hora")
    expect(html).toContain("10:00")
    expect(html).toContain("<table")
  })

  it("genera filas para cada detalle", () => {
    const html = cajaDetalle([
      { etiqueta: "A", valor: "1" },
      { etiqueta: "B", valor: "2" },
      { etiqueta: "C", valor: "3" },
    ])
    const trCount = (html.match(/<tr>/g) || []).length
    expect(trCount).toBe(3)
  })
})

describe("formatearFecha", () => {
  it("formatea fecha en espanol con dia de la semana", () => {
    // 15 marzo 2024 es viernes
    const fecha = new Date("2024-03-15T12:00:00Z")
    const resultado = formatearFecha(fecha)
    expect(resultado).toContain("viernes")
    expect(resultado).toContain("15")
    expect(resultado).toContain("marzo")
    expect(resultado).toContain("2024")
  })
})

describe("formatearHora", () => {
  it("formatea hora como HH:MM", () => {
    // 14:30 UTC = 15:30 Madrid (CET)
    const fecha = new Date("2024-01-15T14:30:00Z")
    expect(formatearHora(fecha)).toBe("15:30")
  })
})

describe("calcularDuracionMin", () => {
  it("calcula 90 minutos de diferencia", () => {
    const inicio = new Date("2024-01-15T10:00:00Z")
    const fin = new Date("2024-01-15T11:30:00Z")
    expect(calcularDuracionMin(inicio, fin)).toBe(90)
  })

  it("calcula 60 minutos de diferencia", () => {
    const inicio = new Date("2024-01-15T10:00:00Z")
    const fin = new Date("2024-01-15T11:00:00Z")
    expect(calcularDuracionMin(inicio, fin)).toBe(60)
  })

  it("retorna 0 para fechas iguales", () => {
    const fecha = new Date("2024-01-15T10:00:00Z")
    expect(calcularDuracionMin(fecha, fecha)).toBe(0)
  })
})

describe("traducirEstadoPago", () => {
  it("traduce 'paid' a 'Pagado'", () => {
    expect(traducirEstadoPago("paid")).toBe("Pagado")
  })

  it("traduce 'exempt' a 'Pago presencial'", () => {
    expect(traducirEstadoPago("exempt")).toBe("Pago presencial")
  })

  it("traduce 'pending' a 'Pendiente de pago'", () => {
    expect(traducirEstadoPago("pending")).toBe("Pendiente de pago")
  })

  it("retorna el valor original para estados desconocidos", () => {
    expect(traducirEstadoPago("refunded")).toBe("refunded")
  })
})
