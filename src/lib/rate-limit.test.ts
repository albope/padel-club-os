import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { crearRateLimiter, obtenerIP } from "./rate-limit"

describe("crearRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("permite la primera llamada", () => {
    const limiter = crearRateLimiter({ maxRequests: 3, windowMs: 60000 })
    expect(limiter.verificar("1.1.1.1")).toBe(true)
  })

  it("permite hasta maxRequests llamadas", () => {
    const limiter = crearRateLimiter({ maxRequests: 3, windowMs: 60000 })
    expect(limiter.verificar("1.1.1.1")).toBe(true)
    expect(limiter.verificar("1.1.1.1")).toBe(true)
    expect(limiter.verificar("1.1.1.1")).toBe(true)
  })

  it("bloquea la llamada maxRequests+1", () => {
    const limiter = crearRateLimiter({ maxRequests: 3, windowMs: 60000 })
    limiter.verificar("1.1.1.1")
    limiter.verificar("1.1.1.1")
    limiter.verificar("1.1.1.1")
    expect(limiter.verificar("1.1.1.1")).toBe(false)
  })

  it("resetea tras expirar la ventana de tiempo", () => {
    const limiter = crearRateLimiter({ maxRequests: 2, windowMs: 60000 })
    limiter.verificar("1.1.1.1")
    limiter.verificar("1.1.1.1")
    expect(limiter.verificar("1.1.1.1")).toBe(false)

    // Avanzar 60 segundos
    vi.advanceTimersByTime(60001)

    expect(limiter.verificar("1.1.1.1")).toBe(true)
  })

  it("mantiene contadores independientes por IP", () => {
    const limiter = crearRateLimiter({ maxRequests: 1, windowMs: 60000 })
    expect(limiter.verificar("1.1.1.1")).toBe(true)
    expect(limiter.verificar("1.1.1.1")).toBe(false)
    // Otra IP sigue permitida
    expect(limiter.verificar("2.2.2.2")).toBe(true)
  })

  it("no resetea dentro de la ventana activa", () => {
    const limiter = crearRateLimiter({ maxRequests: 2, windowMs: 60000 })
    limiter.verificar("1.1.1.1")
    limiter.verificar("1.1.1.1")

    // Avanzar 30 segundos (mitad de la ventana)
    vi.advanceTimersByTime(30000)

    expect(limiter.verificar("1.1.1.1")).toBe(false)
  })
})

describe("obtenerIP", () => {
  it("extrae IP del header x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    })
    expect(obtenerIP(req)).toBe("1.2.3.4")
  })

  it("toma la primera IP cuando hay multiples", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3" },
    })
    expect(obtenerIP(req)).toBe("1.1.1.1")
  })

  it("recorta espacios de la IP", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "  1.2.3.4  " },
    })
    expect(obtenerIP(req)).toBe("1.2.3.4")
  })

  it("retorna 'unknown' sin header x-forwarded-for", () => {
    const req = new Request("http://localhost")
    expect(obtenerIP(req)).toBe("unknown")
  })
})
