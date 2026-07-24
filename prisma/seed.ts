import { PrismaClient } from "@prisma/client"
import {
  borrarClubDemo,
  crearClubDemo,
  passwordAleatoria,
} from "../src/lib/demo-club"

const prisma = new PrismaClient()

async function main() {
  const slug = (process.env.DEMO_CLUB_SLUG || "club-padel-demo").trim().toLowerCase()
  const clubName = (process.env.DEMO_CLUB_NAME || "Club Pádel Demo").trim()
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || passwordAleatoria()
  const playerPassword = process.env.DEMO_PLAYER_PASSWORD || passwordAleatoria()

  if (process.env.NODE_ENV === "production") {
    if (!process.env.DEMO_ADMIN_PASSWORD || !process.env.DEMO_PLAYER_PASSWORD) {
      throw new Error(
        "En produccion, DEMO_ADMIN_PASSWORD y DEMO_PLAYER_PASSWORD son obligatorias para un seed estable.",
      )
    }
  }

  const existente = await prisma.club.findUnique({
    where: { slug },
    select: { esDemo: true },
  })
  if (existente && !existente.esDemo) {
    throw new Error(`El slug "${slug}" pertenece a un club real; el seed no lo modificara.`)
  }
  if (existente) {
    await borrarClubDemo(prisma, slug)
  }

  const demo = await crearClubDemo(prisma, {
    clubName,
    slug,
    numCourts: 6,
    numPlayers: 12,
    adminPassword,
    playerPassword,
  })

  console.log("Club demo restaurado de forma idempotente.")
  console.log(`Portal: /club/${demo.slug}`)
  console.log(`Admin: ${demo.adminEmail}`)
  console.log(`Jugador: ${demo.playerEmail}`)
  if (process.env.NODE_ENV !== "production") {
    console.log(`Password admin: ${demo.adminPassword}`)
    console.log(`Password jugador: ${demo.playerPassword}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
