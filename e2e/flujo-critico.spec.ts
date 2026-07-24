import { test, expect } from "@playwright/test"
import { PrismaClient } from "@prisma/client"

// E2E del flujo critico comercial:
//   Admin: registro de club -> wizard de configuracion -> reserva desde el grid
//   Jugador: registro en el portal -> login -> reserva desde el grid publico
//
// En CI corre contra PostgreSQL efimero. En local usa exclusivamente la base de
// desarrollo configurada y limpia todos los datos creados al terminar.

const ts = Date.now()
const adminName = `E2E Admin ${ts}`
const clubName = `E2E Club ${ts}`
const adminEmail = `e2e-admin-${ts}@e2e.test`
const playerEmail = `e2e-jugador-${ts}@e2e.test`
const password = "e2ePassword123"

const clubSlug = `e2e-club-${ts}`

const PISTA_ADMIN = "Pista Central"
const PISTA_JUGADOR = "Pista Anexa"

// Siempre se usa mañana, por lo que la prueba no depende de la hora del runner.
const slot = "10:00"
const prisma = new PrismaClient()

test.describe.serial("Flujo critico: alta de club, configuracion y reservas", () => {
  test.afterAll(async () => {
    const club = await prisma.club.findUnique({
      where: { slug: clubSlug },
      select: {
        id: true,
        memberships: { select: { userId: true } },
      },
    })
    if (club) {
      const userIds = club.memberships.map((membership) => membership.userId)
      await prisma.$transaction(async (tx) => {
        await tx.legalAcceptance.deleteMany({ where: { clubId: club.id } })
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { clubId: null },
        })
        await tx.club.delete({ where: { id: club.id } })
        await tx.user.deleteMany({ where: { id: { in: userIds } } })
      })
    }
    await prisma.$disconnect()
  })

  test("admin: registro, wizard de configuracion y reserva en el grid", async ({ page }) => {
    // --- Registro del club ---
    await page.goto("/register")
    await page.getByRole("button", { name: "Entendido" }).click()
    await page.locator("#name").fill(adminName)
    await page.locator("#clubName").fill(clubName)
    await page.locator("#email").fill(adminEmail)
    await page.locator("#password").fill(password)
    await page.getByRole("checkbox", { name: /condiciones/i }).check()
    await page.getByRole("button", { name: "Crear cuenta gratis" }).click()
    await page.waitForURL("**/login**", { timeout: 30_000 })

    // Simula el clic en el enlace enviado por email; el transporte de correo se
    // prueba por separado y no debe volver frágil el journey de navegador.
    await prisma.user.update({
      where: { email: adminEmail },
      data: { emailVerified: new Date() },
    })

    // --- Login ---
    await page.locator("#email").fill(adminEmail)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: "Iniciar sesión" }).click()
    await page.waitForURL("**/dashboard", { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: /Bienvenido a/ })).toBeVisible({ timeout: 20_000 })

    // --- Wizard de configuracion inicial ---
    await page.goto("/dashboard/configuracion-inicial")
    // Acotar al contenido principal evita que el HTML de streaming de Next
    // duplique temporalmente los nodos dentro de su contenedor oculto.
    const wizard = page.locator("#contenido-principal")
    await expect(
      wizard.getByRole("heading", { name: "Informacion del club", exact: true }),
    ).toBeVisible({ timeout: 20_000 })

    // Paso 1: informacion basica
    await wizard.locator("#phone").fill("600 123 123")
    await wizard.getByRole("button", { name: "Siguiente" }).click()

    // Paso 2: crear dos pistas (el input se vacia tras crear cada una)
    await expect(wizard.getByText("Pistas de tu club")).toBeVisible({ timeout: 30_000 })
    await wizard.locator("#courtName").fill(PISTA_ADMIN)
    await wizard.getByRole("button", { name: "Añadir pista" }).click()
    await expect(wizard.locator("#courtName")).toHaveValue("", { timeout: 15_000 })
    await wizard.locator("#courtName").fill(PISTA_JUGADOR)
    await wizard.getByRole("button", { name: "Añadir pista" }).click()
    await expect(wizard.locator("#courtName")).toHaveValue("", { timeout: 15_000 })
    await wizard.getByRole("button", { name: "Siguiente" }).click()

    // Paso 3: precio uniforme
    await expect(wizard.getByText("Precios basicos")).toBeVisible()
    await wizard.locator("#price").fill("20")
    await wizard.getByRole("button", { name: "Finalizar configuracion" }).click()

    // Paso 4: club listo
    await expect(wizard.getByText("Tu club esta listo")).toBeVisible({ timeout: 20_000 })
    await expect(wizard.getByText(clubSlug)).toBeVisible()
    await wizard.getByRole("button", { name: "Ir al dashboard" }).click()
    await page.waitForURL("**/dashboard", { timeout: 30_000 })

    // --- Crear una reserva desde el grid de reservas ---
    await page.goto("/dashboard/reservas")
    const reservasAdmin = page.locator("#contenido-principal")
    await expect(
      reservasAdmin.getByRole("heading", { name: "Calendario de Reservas", exact: true }),
    ).toBeVisible({ timeout: 20_000 })
    await reservasAdmin.getByRole("button", { name: "Día siguiente" }).click()

    await reservasAdmin
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
      reservasAdmin.getByRole("button", { name: /Ver reserva de Invitado E2E/ })
    ).toBeVisible({ timeout: 20_000 })
  })

  test("jugador: registro en el portal, login y reserva en el grid publico", async ({ page }) => {
    // --- Registro de jugador ---
    await page.goto(`/club/${clubSlug}/registro`)
    const registroJugador = page.locator("main:visible")
    await expect(registroJugador.locator("#name")).toBeVisible({ timeout: 20_000 })
    await registroJugador.locator("#name").fill("E2E Jugador")
    await registroJugador.locator("#email").fill(playerEmail)
    await registroJugador.locator("#password").fill(password)
    await registroJugador.getByRole("checkbox", { name: /política de privacidad/i }).check()
    await registroJugador.getByRole("button", { name: "Crear cuenta" }).click()
    await expect(
      registroJugador.getByText(/^(Solicitud enviada|Cuenta creada)$/i),
    ).toBeVisible({ timeout: 30_000 })

    // Simula verificación de email + aprobación por el club (modo APPROVAL).
    const club = await prisma.club.findUniqueOrThrow({ where: { slug: clubSlug } })
    const player = await prisma.user.findUniqueOrThrow({ where: { email: playerEmail } })
    await prisma.$transaction([
      prisma.user.update({
        where: { id: player.id },
        data: { emailVerified: new Date(), clubId: club.id },
      }),
      prisma.clubMembership.update({
        where: { userId_clubId: { userId: player.id, clubId: club.id } },
        data: { status: "ACTIVE", approvedAt: new Date() },
      }),
    ])

    // --- Login de jugador ---
    await page.goto(`/club/${clubSlug}/login`)
    const loginJugador = page.locator("main:visible")
    await loginJugador.locator("#email").fill(playerEmail)
    await loginJugador.locator("#password").fill(password)
    await loginJugador.getByRole("button", { name: "Iniciar sesión" }).click()
    await page.waitForURL(`**/club/${clubSlug}`, { timeout: 30_000 })

    // --- Reservar pista desde el grid publico ---
    await page.goto(`/club/${clubSlug}/reservar`)
    const reservasJugador = page.locator("main:visible")
    await expect(
      reservasJugador.getByRole("heading", { name: /Reservar pista/i }),
    ).toBeVisible({ timeout: 20_000 })
    await expect(reservasJugador.getByText("Hoy", { exact: true })).toBeVisible()
    await expect(reservasJugador.getByRole("button", { name: "Volver a hoy" })).toHaveCount(0)
    await reservasJugador.getByRole("button", { name: "Día siguiente" }).click()
    await expect(
      reservasJugador.getByRole("button", { name: "Volver a hoy" }),
    ).toBeVisible()

    // Mismo horario que el admin pero en la otra pista (sin solape)
    await reservasJugador
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

  test("calidad basica: portal movil, imagenes y cabeceras de seguridad", async ({ page, request }) => {
    const response = await request.get(`/club/${clubSlug}`)
    expect(response.ok()).toBeTruthy()
    expect(response.headers()["x-content-type-options"]).toBe("nosniff")
    expect(response.headers()["content-security-policy"]).toContain("default-src 'self'")

    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(`/club/${clubSlug}`)
    await expect(page.locator("main:visible")).toBeVisible()
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    )
    expect(hasHorizontalOverflow).toBe(false)

    const brokenVisibleImages = await page.locator("img:visible").evaluateAll((images) =>
      images.filter((image) => !(image as HTMLImageElement).complete
        || (image as HTMLImageElement).naturalWidth === 0).length
    )
    expect(brokenVisibleImages).toBe(0)
  })
})
