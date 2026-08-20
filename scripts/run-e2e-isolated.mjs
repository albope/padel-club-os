import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "@prisma/client"

function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    try {
      for (const rawLine of readFileSync(filename, "utf8").split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith("#")) continue
        const separator = line.indexOf("=")
        if (separator < 1) continue
        const key = line.slice(0, separator).trim()
        let value = line.slice(separator + 1).trim()
        if (
          (value.startsWith('"') && value.endsWith('"'))
          || (value.startsWith("'") && value.endsWith("'"))
        ) value = value.slice(1, -1)
        if (!process.env[key]) process.env[key] = value
      }
    } catch {
      // El archivo es opcional.
    }
  }
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
    shell: false,
  })
  if (result.error) throw result.error
  return result.status ?? 1
}

loadLocalEnv()
const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!directUrl) throw new Error("DIRECT_URL o DATABASE_URL es obligatorio")

const schema = `pcos_e2e_local_${Date.now()}`
if (!/^pcos_e2e_local_\d+$/.test(schema)) throw new Error("Schema E2E invalido")

const baseUrl = new URL(directUrl)
baseUrl.searchParams.delete("schema")
const testUrl = new URL(baseUrl)
testUrl.searchParams.set("schema", schema)
const testEnv = {
  ...process.env,
  DATABASE_URL: testUrl.toString(),
  DIRECT_URL: testUrl.toString(),
  RATE_LIMIT_BACKEND: "memory",
  RATE_LIMIT_ALLOW_MEMORY: "true",
  NEXTAUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  // Cada ejecución usa un schema único: no comparte objetos con otra migración.
  PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1",
}
const admin = new PrismaClient({
  datasources: { db: { url: baseUrl.toString() } },
})

let exitCode = 1
try {
  console.log(`Preparando PostgreSQL aislado para E2E: ${schema}`)
  const prismaCli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url))
  for (let intento = 1; intento <= 3; intento++) {
    exitCode = run(process.execPath, [prismaCli, "migrate", "deploy"], testEnv)
    if (exitCode === 0) break
    if (intento < 3) {
      console.warn(`Migracion E2E ocupada o no disponible; reintento ${intento + 1}/3...`)
      await new Promise((resolve) => setTimeout(resolve, 2_000))
    }
  }
  if (exitCode !== 0) throw new Error("No se pudieron aplicar las migraciones E2E")

  const playwrightCli = fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url))
  exitCode = run(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], testEnv)
} finally {
  console.log(`Eliminando PostgreSQL aislado para E2E: ${schema}`)
  await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
  await admin.$disconnect()
}

process.exitCode = exitCode
