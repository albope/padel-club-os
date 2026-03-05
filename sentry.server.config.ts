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
    ignoreErrors: [
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
      "NEXT_HTTP_ERROR",
      "AbortError",
      "ECONNRESET",
    ],

    // Sanitizar datos sensibles antes de enviar a Sentry
    beforeSend(event) {
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>
        const camposSensibles = ["password", "token", "secret", "authorization", "cookie", "creditCard"]
        for (const campo of camposSensibles) {
          for (const key of Object.keys(data)) {
            if (key.toLowerCase().includes(campo)) {
              data[key] = "[REDACTED]"
            }
          }
        }
      }
      // Limpiar headers sensibles
      if (event.request?.headers) {
        const headersSensibles = ["authorization", "cookie", "x-api-key"]
        for (const header of headersSensibles) {
          if (event.request.headers[header]) {
            event.request.headers[header] = "[REDACTED]"
          }
        }
      }
      return event
    },
  })
}
