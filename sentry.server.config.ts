import * as Sentry from "@sentry/nextjs"

// Solo inicializar si el DSN esta configurado
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",

    // Capturar 100% de errores, 10% de transacciones (ajustar segun volumen)
    tracesSampleRate: 0.1,

    // Solo activo en produccion
    enabled: process.env.NODE_ENV === "production",

    // Filtrar errores internos de Next.js
    ignoreErrors: ["NEXT_NOT_FOUND", "NEXT_REDIRECT"],
  })
}
