// scripts/seed-demo-club.ts - CLI para crear/borrar clubes demo.
// La logica vive en src/lib/demo-club.ts (compartida con /api/platform/demo-clubs).
//
// Uso:
//   npx tsx scripts/seed-demo-club.ts [opciones]
//
// Opciones:
//   --name "Club Náutico Viana do Bolo"   Nombre del club (default)
//   --slug club-nautico-viana-do-bolo     Slug (default: derivado del nombre)
//   --courts 2                            Número de pistas (1-8)
//   --players 12                          Número de socios (4-12)
//   --admin-password <pwd>                Password del admin (default: aleatoria)
//   --player-password <pwd>               Password de los socios (default: aleatoria)
//   --reset                               Borra el club demo existente y lo recrea
//   --delete                              Solo borra el club demo y sale
//   --confirm                             Obligatorio si DATABASE_URL no es localhost
//
// Seguridad: aborta si el slug ya existe (salvo --reset). El borrado solo funciona
// sobre clubes con esDemo = true y usuarios del namespace "@{slug}.demo".

import { PrismaClient } from "@prisma/client"
import {
  crearClubDemo,
  borrarClubDemo,
  slugifyClub,
  passwordAleatoria,
} from "../src/lib/demo-club"

const prisma = new PrismaClient()

interface Args {
  name: string
  slug: string
  courts: number
  players: number
  adminPassword: string
  playerPassword: string
  reset: boolean
  delete: boolean
  confirm: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    name: "Club Náutico Viana do Bolo",
    slug: "",
    courts: 2,
    players: 12,
    adminPassword: passwordAleatoria(),
    playerPassword: passwordAleatoria(),
    reset: false,
    delete: false,
    confirm: false,
  }

  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i]
    const valor = argv[i + 1]
    switch (flag) {
      case "--name":
        args.name = valor
        i++
        break
      case "--slug":
        args.slug = valor
        i++
        break
      case "--courts":
        args.courts = parseInt(valor, 10)
        i++
        break
      case "--players":
        args.players = parseInt(valor, 10)
        i++
        break
      case "--admin-password":
        args.adminPassword = valor
        i++
        break
      case "--player-password":
        args.playerPassword = valor
        i++
        break
      case "--reset":
        args.reset = true
        break
      case "--delete":
        args.delete = true
        break
      case "--confirm":
        args.confirm = true
        break
      default:
        console.error(`❌ Opción desconocida: ${flag}`)
        process.exit(1)
    }
  }

  if (!args.slug) args.slug = slugifyClub(args.name)
  if (!Number.isInteger(args.courts) || args.courts < 1 || args.courts > 8) {
    console.error("❌ --courts debe ser un entero entre 1 y 8")
    process.exit(1)
  }
  if (!Number.isInteger(args.players) || args.players < 4 || args.players > 12) {
    console.error("❌ --players debe ser un entero entre 4 y 12")
    process.exit(1)
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv)

  // --- Preflight: destino de la base de datos ---
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error("❌ DATABASE_URL no está definida")
    process.exit(1)
  }
  let dbHost: string
  try {
    dbHost = new URL(dbUrl).hostname
  } catch {
    console.error("❌ DATABASE_URL no es una URL válida")
    process.exit(1)
  }
  const esLocal = dbHost === "localhost" || dbHost === "127.0.0.1"

  console.log("🎾 Seed de club demo")
  console.log(`   Base de datos: ${dbHost} ${esLocal ? "(local)" : "(REMOTA)"}`)
  console.log(`   Club: ${args.name} (slug: ${args.slug})`)
  console.log(`   Pistas: ${args.courts} | Socios: ${args.players} | Reset: ${args.reset ? "sí" : "no"}`)

  if (!esLocal && !args.confirm) {
    console.error("\n❌ DATABASE_URL apunta a una base de datos remota.")
    console.error("   Añade --confirm para ejecutar contra esta base de datos.")
    process.exit(1)
  }

  // --- Modo borrado / reset ---
  if (args.delete || args.reset) {
    try {
      const { usuariosBorrados } = await borrarClubDemo(prisma, args.slug)
      console.log(`\n🗑️  Club "${args.slug}" y ${usuariosBorrados} usuarios demo eliminados`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === "CLUB_NO_ENCONTRADO") {
        if (args.delete) {
          console.error(`\n❌ No existe ningún club con slug "${args.slug}"`)
          process.exit(1)
        }
        // --reset sobre club inexistente: continuar y crear
      } else if (msg === "NO_ES_DEMO") {
        console.error(`\n❌ El club "${args.slug}" NO está marcado como demo (esDemo). No se borra.`)
        process.exit(1)
      } else {
        throw e
      }
    }
    if (args.delete) return
  }

  // --- Crear ---
  const resultado = await crearClubDemo(prisma, {
    clubName: args.name,
    slug: args.slug,
    numCourts: args.courts,
    numPlayers: args.players,
    adminPassword: args.adminPassword,
    playerPassword: args.playerPassword,
  })

  const baseUrl = esLocal ? "http://localhost:3000" : "https://padelclubos.com"
  console.log("\n🎉 Club demo listo!")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`Club:          ${resultado.clubName}`)
  console.log(`Portal:        ${baseUrl}/club/${resultado.slug}`)
  console.log(`Dashboard:     ${baseUrl}/login`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`Admin:         ${resultado.adminEmail}`)
  console.log(`  Password:    ${resultado.adminPassword}`)
  console.log(`Socio ejemplo: ${resultado.playerEmail} (${resultado.playerName})`)
  console.log(`  Password:    ${resultado.playerPassword}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`Datos: ${resultado.contadores.pistas} pistas, ${resultado.contadores.socios} socios, ${resultado.contadores.reservas} reservas, ${resultado.contadores.partidas} partidas, ${resultado.contadores.noticias} noticias, ${resultado.contadores.pagos} pagos`)
  console.log("⚠️  Guarda estas credenciales: las passwords no se pueden recuperar del hash.")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed de club demo:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
