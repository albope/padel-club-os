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

type RateLimitBackend = "upstash" | "database" | "memory" | "blocked"

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
 * Determina el backend de rate limiting.
 * - RATE_LIMIT_BACKEND=memory → fuerza fallback local (tests, dev)
 * - RATE_LIMIT_BACKEND=upstash → fuerza Upstash (falla si no hay credenciales)
 * - RATE_LIMIT_BACKEND=database → PostgreSQL compartido entre instancias
 * - Sin variable → Upstash si esta configurado, PostgreSQL en produccion y
 *   memoria en desarrollo.
 */
function resolverBackend(): RateLimitBackend {
  const backend = process.env.RATE_LIMIT_BACKEND
  if (backend === "memory") {
    const memoriaPermitidaEnPruebas =
      process.env.RATE_LIMIT_ALLOW_MEMORY === "true"
    return process.env.NODE_ENV === "production" && !memoriaPermitidaEnPruebas
      ? "blocked"
      : "memory"
  }
  if (backend === "database") return "database"
  if (backend === "upstash") {
    const redis = obtenerRedis()
    if (!redis) {
      logger.error("RATE_LIMIT", "RATE_LIMIT_BACKEND=upstash sin credenciales Redis", {
        backend: "unavailable",
      })
      return "blocked"
    }
    return "upstash"
  }
  if (obtenerRedis()) return "upstash"
  return process.env.NODE_ENV === "production" ? "database" : "memory"
}

function crearRateLimiterBaseDatos(config: RateLimitConfig): RateLimiter {
  return {
    async verificar(clave: string): Promise<boolean> {
      try {
        const { db } = await import("./db")
        const key = `${config.prefix}:${clave}`.slice(0, 191)
        const rows = await db.$queryRaw<Array<{ count: number }>>`
          WITH cleanup AS (
            DELETE FROM "RateLimitBucket"
            WHERE "resetAt" < NOW() - INTERVAL '1 day'
            RETURNING "key"
          )
          INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
          VALUES (
            ${key},
            1,
            NOW() + (${config.windowMs} * INTERVAL '1 millisecond'),
            NOW()
          )
          ON CONFLICT ("key") DO UPDATE SET
            "count" = CASE
              WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
              ELSE "RateLimitBucket"."count" + 1
            END,
            "resetAt" = CASE
              WHEN "RateLimitBucket"."resetAt" <= NOW()
                THEN NOW() + (${config.windowMs} * INTERVAL '1 millisecond')
              ELSE "RateLimitBucket"."resetAt"
            END,
            "updatedAt" = NOW()
          RETURNING "count"
        `
        return Number(rows[0]?.count ?? config.maxRequests + 1) <= config.maxRequests
      } catch (error) {
        const failClosed = process.env.NODE_ENV === "production"
        logger.warn(
          "RATE_LIMIT",
          `PostgreSQL no disponible, ${failClosed ? "fail-closed" : "fail-open"}`,
          { prefix: config.prefix },
          error,
        )
        return !failClosed
      }
    },
  }
}

/**
 * Crea un rate limiter con backend distribuido (Upstash Redis) o local (memoria).
 *
 * - Con credenciales Upstash: rate limiting compartido entre todas las instancias serverless
 * - Sin credenciales: fallback a Map en memoria (aceptable para dev/tests)
 * - Si Redis falla en produccion: fail-closed; en desarrollo: fail-open
 *
 * @param config.prefix - Prefijo unico obligatorio (ej: "rl:forgot-pw", "rl:chat")
 */
export function crearRateLimiter(config: RateLimitConfig): RateLimiter {
  const backend = resolverBackend()

  if (backend === "upstash") {
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
          const failClosed = process.env.NODE_ENV === "production"
          logger.warn("RATE_LIMIT", `Redis no disponible, ${failClosed ? "fail-closed" : "fail-open"}`, {
            prefix: config.prefix,
            clave: clave.length > 8 ? clave.substring(0, 8) + "..." : clave,
          }, error)
          return !failClosed
        }
      },
    }
  }

  if (backend === "database") {
    return crearRateLimiterBaseDatos(config)
  }

  if (backend === "blocked") {
    // No registrar en la importacion: Next carga los modulos durante el build.
    // El fallo se informa una sola vez al recibir una peticion real.
    let logged = false
    return {
      async verificar(): Promise<boolean> {
        if (!logged) {
          logged = true
          logger.error("RATE_LIMIT", "Rate limiting distribuido no configurado; peticiones protegidas bloqueadas", {
            prefix: config.prefix,
            backend: process.env.RATE_LIMIT_BACKEND || "auto",
          })
        }
        return false
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
