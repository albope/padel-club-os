import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "@prisma/client"

function cargarEnvLocal() {
  try {
    const contenido = readFileSync(".env", "utf8")
    for (const linea of contenido.split(/\r?\n/)) {
      const limpia = linea.trim()
      if (!limpia || limpia.startsWith("#")) continue
      const separador = limpia.indexOf("=")
      if (separador < 1) continue
      const clave = limpia.slice(0, separador).trim()
      let valor = limpia.slice(separador + 1).trim()
      if (
        (valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))
      ) {
        valor = valor.slice(1, -1)
      }
      if (!process.env[clave]) process.env[clave] = valor
    }
  } catch {
    // En CI las variables ya llegan por el entorno.
  }
}

function ejecutarPrisma(argumentos, databaseUrl) {
  const prismaCli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url))
  const resultado = spawnSync(process.execPath, [prismaCli, ...argumentos], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
    stdio: "pipe",
  })

  if (resultado.stdout) process.stdout.write(resultado.stdout)
  if (resultado.stderr) process.stderr.write(resultado.stderr)
  if (resultado.status !== 0) {
    throw new Error(`Prisma termino con codigo ${resultado.status ?? "desconocido"}`)
  }
}

cargarEnvLocal()

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL es obligatorio para probar las migraciones")
}

const schemaPrueba = `pcos_migration_test_${Date.now()}`
if (!/^pcos_migration_test_\d+$/.test(schemaPrueba)) {
  throw new Error("Nombre de schema de prueba invalido")
}

const urlBase = new URL(process.env.DATABASE_URL)
const urlPrueba = new URL(process.env.DATABASE_URL)
urlPrueba.searchParams.set("schema", schemaPrueba)

const admin = new PrismaClient({
  datasources: { db: { url: urlBase.toString() } },
})

try {
  console.log(`Aplicando migraciones en schema aislado ${schemaPrueba}...`)
  ejecutarPrisma(["migrate", "deploy"], urlPrueba.toString())

  console.log("Verificando que migraciones y schema Prisma coinciden...")
  ejecutarPrisma(
    [
      "migrate",
      "diff",
      "--from-url",
      urlPrueba.toString(),
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    urlPrueba.toString(),
  )

  const restricciones = await admin.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count
     FROM pg_constraint c
     JOIN pg_namespace n ON n.oid = c.connamespace
     WHERE n.nspname = $1
       AND c.conname IN (
         'Booking_no_active_overlap',
         'Booking_valid_time_range',
         'Payment_non_negative_amount',
         'PlayerRating_valid_stars'
       )`,
    schemaPrueba,
  )

  const count = Number(restricciones[0]?.count ?? 0)
  if (count !== 4) {
    throw new Error(`Faltan restricciones de dominio: encontradas ${count} de 4`)
  }

  console.log("Migraciones verificadas correctamente desde una base vacia.")
} finally {
  console.log(`Eliminando schema aislado ${schemaPrueba}...`)
  await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaPrueba}" CASCADE`)
  await admin.$disconnect()
}
