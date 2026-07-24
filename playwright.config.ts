import { defineConfig, devices } from "@playwright/test"
import "dotenv/config"

// E2E del flujo critico contra la rama dev de Neon (NUNCA produccion):
// - Local: usa el dev server y el DATABASE_URL del .env. Uso: npm run test:e2e
// - CI (job e2e): PostgreSQL efimero + build/start de produccion
const enCI = !!process.env.CI

export default defineConfig({
  testDir: "./e2e",
  // El servidor local compila rutas bajo demanda; el journey de alta completo
  // recorre varias pantallas. En CI se ejecuta sobre build de produccion.
  timeout: 180_000,
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
    env: {
      RATE_LIMIT_BACKEND: "memory",
      // Excepcion deliberada y confinada al servidor efimero de Playwright.
      // Produccion sigue fallando de forma cerrada si no hay Upstash.
      RATE_LIMIT_ALLOW_MEMORY: "true",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
})
