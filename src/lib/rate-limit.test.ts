import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { crearRateLimiter, obtenerIP, _formatearVentanaUpstash } from "./rate-limit"

// Forzar fallback local en todos los tests
beforeEach(() => {
  process.env.RATE_LIMIT_BACKEND = "memory"
})

afterEach(() => {
  delete process.env.RATE_LIMIT_BACKEND
})

describe("crearRateLimiter (fallback local)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("permite la primera llamada", async () => {
    const limiter = crearRateLimiter({ maxRequests: 3, windowMs: 60000, prefix: "rl:test" })
    expect(await limiter.verificar("1.1.1.1")).toBe(true)
  })

  it("permite hasta maxRequests llamadas", async () => {
    const limiter = crearRateLimiter({ maxRequests: 3, windowMs: 60000, prefix: "rl:test" })
    expect(await limiter.verificar("1.1.1.1")).toBe(true)
    expect(await limiter.verificar("1.1.1.1")).toBe(true)
    expect(await limiter.verificar("1.1.1.1")).toBe(true)
  })

  it("bloquea la llamada maxRequests+1", async () => {
    const limiter = crearRateLimiter({ maxRequests: 3, windowMs: 60000, prefix: "rl:test" })
    await limiter.verificar("1.1.1.1")
    await limiter.verificar("1.1.1.1")
    await limiter.verificar("1.1.1.1")
    expect(await limiter.verificar("1.1.1.1")).toBe(false)
  })

  it("resetea tras expirar la ventana de tiempo", async () => {
    const limiter = crearRateLimiter({ maxRequests: 2, windowMs: 60000, prefix: "rl:test" })
    await limiter.verificar("1.1.1.1")
    await limiter.verificar("1.1.1.1")
    expect(await limiter.verificar("1.1.1.1")).toBe(false)

    vi.advanceTimersByTime(60001)

    expect(await limiter.verificar("1.1.1.1")).toBe(true)
  })

  it("mantiene contadores independientes por clave", async () => {
    const limiter = crearRateLimiter({ maxRequests: 1, windowMs: 60000, prefix: "rl:test" })
    expect(await limiter.verificar("1.1.1.1")).toBe(true)
    expect(await limiter.verificar("1.1.1.1")).toBe(false)
    expect(await limiter.verificar("2.2.2.2")).toBe(true)
  })

  it("no resetea dentro de la ventana activa", async () => {
    const limiter = crearRateLimiter({ maxRequests: 2, windowMs: 60000, prefix: "rl:test" })
    await limiter.verificar("1.1.1.1")
    await limiter.verificar("1.1.1.1")

    vi.advanceTimersByTime(30000)

    expect(await limiter.verificar("1.1.1.1")).toBe(false)
  })

  it("verificar siempre retorna Promise", () => {
    const limiter = crearRateLimiter({ maxRequests: 1, windowMs: 60000, prefix: "rl:test" })
    const resultado = limiter.verificar("1.1.1.1")
    expect(resultado).toBeInstanceOf(Promise)
  })
})

describe("formatearVentanaUpstash", () => {
  it("convierte horas", () => {
    expect(_formatearVentanaUpstash(3600000)).toBe("1 h")
    expect(_formatearVentanaUpstash(7200000)).toBe("2 h")
  })

  it("convierte minutos", () => {
    expect(_formatearVentanaUpstash(60000)).toBe("1 m")
    expect(_formatearVentanaUpstash(900000)).toBe("15 m")
  })

  it("convierte segundos", () => {
    expect(_formatearVentanaUpstash(1000)).toBe("1 s")
    expect(_formatearVentanaUpstash(5000)).toBe("5 s")
  })

  it("convierte milisegundos cuando no encaja en s/m/h", () => {
    expect(_formatearVentanaUpstash(1500)).toBe("1500 ms")
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
