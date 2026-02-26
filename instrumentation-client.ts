import * as Sentry from "@sentry/nextjs"

// Solo inicializar si el DSN esta configurado
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",

    // Replay desactivado por defecto (consume recursos)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
  })
}
