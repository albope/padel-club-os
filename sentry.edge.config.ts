import * as Sentry from "@sentry/nextjs"

// Solo inicializar si el DSN esta configurado
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",

    ignoreErrors: [
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
      "NEXT_HTTP_ERROR",
    ],
  })
}
