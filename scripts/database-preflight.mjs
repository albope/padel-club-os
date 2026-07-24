import { readFileSync } from "node:fs"
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

cargarEnvLocal()

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL es obligatorio para el preflight")
}

const databaseUrl = new URL(process.env.DATABASE_URL)
if (!databaseUrl.searchParams.has("schema")) {
  databaseUrl.searchParams.set("schema", "public")
}

const db = new PrismaClient({
  datasources: { db: { url: databaseUrl.toString() } },
})

const consultas = {
  reservasSolapadas: `
    SELECT COUNT(*)::int AS count
    FROM "public"."Booking" a
    JOIN "public"."Booking" b
      ON a."courtId" = b."courtId"
     AND a.id < b.id
     AND a.status <> 'cancelled'
     AND b.status <> 'cancelled'
     AND a."startTime" < b."endTime"
     AND a."endTime" > b."startTime"
  `,
  reservasInvalidas: `
    SELECT COUNT(*)::int AS count
    FROM "public"."Booking"
    WHERE "endTime" <= "startTime"
       OR "totalPrice" < 0
       OR ("numPlayers" IS NOT NULL AND "numPlayers" NOT BETWEEN 2 AND 4)
       OR status NOT IN ('confirmed', 'cancelled')
  `,
  pagosInvalidos: `
    SELECT (
      (SELECT COUNT(*) FROM "public"."Payment" WHERE amount < 0)
      +
      (SELECT COUNT(*) FROM "public"."BookingPayment" WHERE amount < 0)
    )::int AS count
  `,
  emailsDuplicados: `
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT lower(trim(email))
      FROM "public"."User"
      WHERE email IS NOT NULL
      GROUP BY lower(trim(email))
      HAVING COUNT(*) > 1
    ) duplicados
  `,
  ratingsInvalidos: `
    SELECT COUNT(*)::int AS count
    FROM "public"."PlayerRating"
    WHERE stars NOT BETWEEN 1 AND 5
  `,
}

try {
  const contexto = await db.$queryRawUnsafe(`
    SELECT
      current_schema() AS "currentSchema",
      current_schemas(true) AS "searchPath",
      (
        SELECT table_schema
        FROM information_schema.tables
        WHERE table_name = 'Booking'
        ORDER BY CASE WHEN table_schema = 'public' THEN 0 ELSE 1 END
        LIMIT 1
      ) AS "bookingSchema"
  `)
  console.log(JSON.stringify({ contexto: contexto[0] }, null, 2))

  const resultado = {}
  for (const [nombre, sql] of Object.entries(consultas)) {
    const filas = await db.$queryRawUnsafe(sql)
    resultado[nombre] = Number(filas[0]?.count ?? 0)
  }

  console.log(JSON.stringify(resultado, null, 2))

  const totalProblemas = Object.values(resultado).reduce((total, valor) => total + valor, 0)
  if (totalProblemas > 0) {
    throw new Error(
      `Preflight bloqueado: hay ${totalProblemas} inconsistencias que deben sanearse antes de migrar`,
    )
  }

  console.log("Preflight de datos superado.")
} finally {
  await db.$disconnect()
}
