import * as Sentry from "@sentry/nextjs"

// Solo inicializar si el DSN esta configurado
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",

    // Replay: 0% sesiones normales, 50% sesiones con error (util para debug)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,

    ignoreErrors: [
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
      "ResizeObserver loop",
      "AbortError",
      "ChunkLoadError",
    ],
  })
}
