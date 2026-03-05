import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { logger } from "@/lib/logger"

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  /** Prefijo unico obligatorio para evitar colisiones entre endpoints en Redis */
  prefix: string
}

interface RateLimiter {
  verificar(clave: string): Promise<boolean>
}

// Singleton Redis — reutilizado entre todos los limiters
let _redis: Redis | null = null

function obtenerRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

/**
 * Convierte milisegundos a formato documentado de Upstash.
 * Ej: 900000 → "15 m", 3600000 → "1 h", 60000 → "1 m", 5000 → "5 s"
 */
function formatearVentanaUpstash(ms: number): `${number} ms` | `${number} s` | `${number} m` | `${number} h` {
  if (ms >= 3600000 && ms % 3600000 === 0) return `${ms / 3600000} h`
  if (ms >= 60000 && ms % 60000 === 0) return `${ms / 60000} m`
  if (ms >= 1000 && ms % 1000 === 0) return `${ms / 1000} s`
  return `${ms} ms`
}

/**
 * Determina si usar Upstash (distribuido) o fallback local (memoria).
 * - RATE_LIMIT_BACKEND=memory → fuerza fallback local (tests, dev)
 * - RATE_LIMIT_BACKEND=upstash → fuerza Upstash (falla si no hay credenciales)
 * - Sin variable → auto-detecta por presencia de credenciales
 */
function usarUpstash(): boolean {
  const backend = process.env.RATE_LIMIT_BACKEND
  if (backend === "memory") return false
  if (backend === "upstash") {
    const redis = obtenerRedis()
    if (!redis) {
      logger.warn("RATE_LIMIT", "RATE_LIMIT_BACKEND=upstash pero faltan UPSTASH_REDIS_REST_URL/TOKEN, usando fallback local", {
        backend: "memory",
      })
      return false
    }
    return true
  }
  return obtenerRedis() !== null
}

/**
 * Crea un rate limiter con backend distribuido (Upstash Redis) o local (memoria).
 *
 * - Con credenciales Upstash: rate limiting compartido entre todas las instancias serverless
 * - Sin credenciales: fallback a Map en memoria (aceptable para dev/tests)
 * - Si Redis falla en runtime: fail-open (permite request) + log warning
 *
 * @param config.prefix - Prefijo unico obligatorio (ej: "rl:forgot-pw", "rl:chat")
 */
export function crearRateLimiter(config: RateLimitConfig): RateLimiter {
  if (usarUpstash()) {
    const limiter = new Ratelimit({
      redis: obtenerRedis()!,
      limiter: Ratelimit.fixedWindow(config.maxRequests, formatearVentanaUpstash(config.windowMs)),
      prefix: config.prefix,
    })
    return {
      async verificar(clave: string): Promise<boolean> {
        try {
          const { success } = await limiter.limit(clave)
          return success
        } catch (error) {
          logger.warn("RATE_LIMIT", "Redis no disponible, fail-open", {
            prefix: config.prefix,
            clave: clave.length > 8 ? clave.substring(0, 8) + "..." : clave,
          }, error)
          return true
        }
      },
    }
  }

  // Fallback local — Map en memoria (cada instancia serverless tiene su propio estado)
  const mapa = new Map<string, { count: number; resetAt: number }>()
  return {
    async verificar(clave: string): Promise<boolean> {
      const now = Date.now()
      const entry = mapa.get(clave)

      if (!entry || now > entry.resetAt) {
        mapa.set(clave, { count: 1, resetAt: now + config.windowMs })
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

// Exportar para tests
export { formatearVentanaUpstash as _formatearVentanaUpstash }
