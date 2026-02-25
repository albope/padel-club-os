interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

/**
 * Crea un rate limiter en memoria.
 * En Vercel serverless cada instancia tiene su propio Map.
 * Aceptable para MVP; mejorable con Upstash Redis en el futuro.
 */
export function crearRateLimiter(config: RateLimitConfig) {
  const mapa = new Map<string, RateLimitEntry>()

  return {
    verificar(ip: string): boolean {
      const now = Date.now()
      const entry = mapa.get(ip)

      if (!entry || now > entry.resetAt) {
        mapa.set(ip, { count: 1, resetAt: now + config.windowMs })
        return true
      }

      if (entry.count >= config.maxRequests) {
        return false
      }

      entry.count++
      return true
    },
  }
}

/** Extrae la IP del cliente desde los headers de la request */
export function obtenerIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || "unknown"
}
