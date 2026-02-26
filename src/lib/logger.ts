type NivelLog = "info" | "warn" | "error"

interface ContextoLog {
  userId?: string
  clubId?: string
  ip?: string
  metodo?: string
  ruta?: string
  [clave: string]: unknown
}

/**
 * Logger estructurado para API routes criticas.
 * En produccion emite JSON (para herramientas de log como Vercel).
 * En desarrollo emite formato legible con [TAG].
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
}

export const logger = {
  info: (etiqueta: string, mensaje: string, contexto?: ContextoLog) =>
    registrar("info", etiqueta, mensaje, contexto),

  warn: (etiqueta: string, mensaje: string, contexto?: ContextoLog) =>
    registrar("warn", etiqueta, mensaje, contexto),

  error: (
    etiqueta: string,
    mensaje: string,
    contexto?: ContextoLog,
    error?: unknown
  ) => registrar("error", etiqueta, mensaje, contexto, error),
}
