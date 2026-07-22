import { defineConfig, devices } from "@playwright/test"

// E2E del flujo critico. Corre contra el dev server local, que usa el
// DATABASE_URL del .env (rama dev de Neon - NUNCA produccion).
// Uso: npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    navigationTimeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
    // Rate limit en memoria: evita que registros repetidos de los tests
    // agoten los limites compartidos (Upstash) entre ejecuciones
    env: { RATE_LIMIT_BACKEND: "memory" },
  },
})
