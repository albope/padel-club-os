import { defineConfig, devices } from "@playwright/test"

// E2E del flujo critico contra la rama dev de Neon (NUNCA produccion):
// - Local: usa el dev server y el DATABASE_URL del .env. Uso: npm run test:e2e
// - CI (job e2e): build + start de produccion con el secret E2E_DATABASE_URL
const enCI = !!process.env.CI

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: enCI ? 1 : 0,
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
    command: enCI ? "npm run build && npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !enCI,
    timeout: 300_000,
    // Rate limit en memoria: evita que registros repetidos de los tests
    // agoten los limites compartidos (Upstash) entre ejecuciones
    env: { RATE_LIMIT_BACKEND: "memory" },
  },
})
