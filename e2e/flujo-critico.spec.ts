import { test, expect } from "@playwright/test"

// E2E del flujo critico comercial:
//   Admin: registro de club -> wizard de configuracion -> reserva desde el grid
//   Jugador: registro en el portal -> login -> reserva desde el grid publico
//
// Corre contra el dev server local (DB = rama dev de Neon, ver playwright.config.ts).
// Cada ejecucion crea un club nuevo con sufijo unico; no limpia datos (la rama dev
// se puede resetear desde Neon con "reset from parent").

const ts = Date.now()
const adminName = `E2E Admin ${ts}`
const adminEmail = `e2e-admin-${ts}@e2e.test`
const playerEmail = `e2e-jugador-${ts}@e2e.test`
const password = "e2ePassword123"

// El registro crea el club "{name}'s Club" y el slug se deriva con slugify:
// "E2E Admin {ts}'s Club" -> "e2e-admin-{ts}-s-club"
const clubSlug = `e2e-admin-${ts}-s-club`

const PISTA_ADMIN = "Pista Central"
const PISTA_JUGADOR = "Pista Anexa"

// El grid admin muestra slots por hora en punta (09:00-22:00). Elegimos el
// primer slot con al menos 2h de margen para que nunca sea pasado. La misma
// hora en punta existe como franja en el grid del jugador (pasos de 30 min).
// La hora se calcula en Europe/Madrid: el runner de CI corre en UTC pero la
// app muestra y valida horas de pared del club.
function slotFuturo(): string {
  const horaMadrid = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
    10
  )
  const hora = Math.max(9, Math.min(20, (horaMadrid === 24 ? 0 : horaMadrid) + 2))
  return `${String(hora).padStart(2, "0")}:00`
}
const slot = slotFuturo()

test.describe.serial("Flujo critico: alta de club, configuracion y reservas", () => {
  test("admin: registro, wizard de configuracion y reserva en el grid", async ({ page }) => {
    // --- Registro del club ---
    await page.goto("/register")
    await page.locator("#name").fill(adminName)
    await page.locator("#email").fill(adminEmail)
    await page.locator("#password").fill(password)
    await page.getByRole("checkbox", { name: /condiciones/i }).check()
    await page.getByRole("button", { name: "Crear cuenta gratis" }).click()
    await page.waitForURL("**/login", { timeout: 30_000 })

    // --- Login ---
    await page.locator("#email").fill(adminEmail)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: "Iniciar sesión" }).click()
    await page.waitForURL("**/dashboard", { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: /Bienvenido a/ })).toBeVisible({ timeout: 20_000 })

    // --- Wizard de configuracion inicial ---
    await page.goto("/dashboard/configuracion-inicial")
    await expect(page.getByText("Informacion del club")).toBeVisible({ timeout: 20_000 })

    // Paso 1: informacion basica
    await page.locator("#phone").fill("600 123 123")
    await page.getByRole("button", { name: "Siguiente" }).click()

    // Paso 2: crear dos pistas (el input se vacia tras crear cada una)
    await expect(page.getByText("Pistas de tu club")).toBeVisible()
    await page.locator("#courtName").fill(PISTA_ADMIN)
    await page.getByRole("button", { name: "Añadir pista" }).click()
    await expect(page.locator("#courtName")).toHaveValue("", { timeout: 15_000 })
    await page.locator("#courtName").fill(PISTA_JUGADOR)
    await page.getByRole("button", { name: "Añadir pista" }).click()
    await expect(page.locator("#courtName")).toHaveValue("", { timeout: 15_000 })
    await page.getByRole("button", { name: "Siguiente" }).click()

    // Paso 3: precio uniforme
    await expect(page.getByText("Precios basicos")).toBeVisible()
    await page.locator("#price").fill("20")
    await page.getByRole("button", { name: "Finalizar configuracion" }).click()

    // Paso 4: club listo
    await expect(page.getByText("Tu club esta listo")).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(clubSlug)).toBeVisible()
    await page.getByRole("button", { name: "Ir al dashboard" }).click()
    await page.waitForURL("**/dashboard", { timeout: 30_000 })

    // --- Crear una reserva desde el grid de reservas ---
    await page.goto("/dashboard/reservas")
    await expect(page.getByText("Calendario de Reservas")).toBeVisible({ timeout: 20_000 })

    await page
      .getByRole("button", { name: `Crear reserva a las ${slot} en ${PISTA_ADMIN}` })
      .click()

    // Modal de nueva reserva: la pista del slot clicado viene preseleccionada
    const tituloModal = page.getByRole("heading", { name: "Nueva Reserva" })
    await expect(tituloModal).toBeVisible()
    await expect(page.locator("#courtId")).toContainText(PISTA_ADMIN)

    // Asignar un invitado: Enter fija el nombre pero NO envia el formulario
    await page.locator("#user-search").fill("Invitado E2E")
    await page.locator("#user-search").press("Enter")
    await expect(tituloModal).toBeVisible()

    await page.getByRole("button", { name: "Confirmar Reserva" }).click()
    await tituloModal.waitFor({ state: "hidden", timeout: 15_000 })

    // La reserva aparece en el grid
    await expect(
      page.getByRole("button", { name: /Ver reserva de Invitado E2E/ })
    ).toBeVisible({ timeout: 20_000 })
  })

  test("jugador: registro en el portal, login y reserva en el grid publico", async ({ page }) => {
    // --- Registro de jugador ---
    await page.goto(`/club/${clubSlug}/registro`)
    await expect(page.locator("#name")).toBeVisible({ timeout: 20_000 })
    await page.locator("#name").fill("E2E Jugador")
    await page.locator("#email").fill(playerEmail)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: "Crear cuenta" }).click()
    await page.waitForURL(`**/club/${clubSlug}/login`, { timeout: 30_000 })

    // --- Login de jugador ---
    await page.locator("#email").fill(playerEmail)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: "Iniciar sesión" }).click()
    await page.waitForURL(`**/club/${clubSlug}`, { timeout: 30_000 })

    // --- Reservar pista desde el grid publico ---
    await page.goto(`/club/${clubSlug}/reservar`)
    await expect(page.getByRole("heading", { name: /Reservar pista/i })).toBeVisible({ timeout: 20_000 })

    // Mismo horario que el admin pero en la otra pista (sin solape)
    await page
      .getByRole("button", { name: new RegExp(`^Reservar ${PISTA_JUGADOR} a las ${slot}`) })
      .click()

    // Sheet de confirmacion (modo presencial)
    await expect(page.getByText("Revisa los detalles antes de confirmar")).toBeVisible()
    await page.getByRole("button", { name: "Confirmar reserva", exact: true }).click()

    // Pantalla de exito dentro del sheet
    await expect(
      page.getByRole("heading", { name: "Reserva confirmada!", level: 3 })
    ).toBeVisible({ timeout: 20_000 })
  })
})
