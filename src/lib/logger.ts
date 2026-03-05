type NivelLog = "info" | "warn" | "error"

interface ContextoLog {
  userId?: string
  clubId?: string
  ip?: string
  metodo?: string
  ruta?: string
  [clave: string]: unknown
}

// Sentry lazy — import dinamico para no romper si no hay DSN
let _sentry: typeof import("@sentry/nextjs") | null = null
let _sentryLoaded = false

function getSentry() {
  if (!_sentryLoaded) {
    _sentryLoaded = true
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs")
        .then((mod) => { _sentry = mod })
        .catch(() => { /* Sentry no disponible */ })
    }
  }
  return _sentry
}

/**
 * Reporta errores y warnings a Sentry con contexto estructurado.
 */
function reportarASentry(
  nivel: NivelLog,
  etiqueta: string,
  mensaje: string,
  contexto?: ContextoLog,
  error?: unknown
) {
  const sentry = getSentry()
  if (!sentry) return

  const extras: Record<string, unknown> = { ...contexto }

  sentry.withScope((scope) => {
    scope.setTag("feature", etiqueta)
    scope.setLevel(nivel === "error" ? "error" : "warning")

    if (contexto?.userId) scope.setTag("userId", contexto.userId)
    if (contexto?.clubId) scope.setTag("clubId", contexto.clubId)
    if (contexto?.ruta) scope.setTag("ruta", contexto.ruta)

    scope.setExtras(extras)

    if (error instanceof Error) {
      sentry.captureException(error)
    } else if (error) {
      sentry.captureException(new Error(`${etiqueta}: ${mensaje} — ${String(error)}`))
    } else {
      sentry.captureMessage(`${etiqueta}: ${mensaje}`, nivel === "error" ? "error" : "warning")
    }
  })
}

/**
 * Logger estructurado para API routes criticas.
 * En produccion emite JSON (para herramientas de log como Vercel).
 * En desarrollo emite formato legible con [TAG].
 * Errores y warnings se reportan automaticamente a Sentry.
 */
function registrar(
  nivel: NivelLog,
  etiqueta: string,
  mensaje: string,
  contexto?: ContextoLog,
  error?: unknown
) {
  const timestamp = new Date().toISOString()

  const entrada = {
    timestamp,
    nivel,
    etiqueta,
    mensaje,
    ...contexto,
    ...(error instanceof Error
      ? { error: error.message, stack: error.stack }
      : error
        ? { error: String(error) }
        : {}),
  }

  const metodo =
    nivel === "error"
      ? console.error
      : nivel === "warn"
        ? console.warn
        : console.info

  if (process.env.NODE_ENV === "production") {
    metodo(JSON.stringify(entrada))
  } else {
    metodo(`[${etiqueta}]`, mensaje, contexto || "")
    if (error) metodo(error)
  }

  // Reportar errores y warnings a Sentry
  if (nivel === "error" || nivel === "warn") {
    reportarASentry(nivel, etiqueta, mensaje, contexto, error)
  }
}

export const logger = {
  info: (etiqueta: string, mensaje: string, contexto?: ContextoLog) =>
    registrar("info", etiqueta, mensaje, contexto),

  warn: (
    etiqueta: string,
    mensaje: string,
    contexto?: ContextoLog,
    error?: unknown
  ) => registrar("warn", etiqueta, mensaje, contexto, error),

  error: (
    etiqueta: string,
    mensaje: string,
    contexto?: ContextoLog,
    error?: unknown
  ) => registrar("error", etiqueta, mensaje, contexto, error),
}
