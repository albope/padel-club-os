// scripts/normalizar-tier-legacy.ts - Normaliza subscriptionTier "essential" -> "starter".
//
// El default historico del schema era "essential", que NO es un plan valido
// (starter|pro|enterprise en src/lib/stripe.ts). El codigo hace fallback a
// starter, pero el dato sucio confunde al backoffice /dashboard/clubs.
//
// Uso:
//   npx tsx scripts/normalizar-tier-legacy.ts             # dry-run: solo muestra que cambiaria
//   npx tsx scripts/normalizar-tier-legacy.ts --apply     # aplica el cambio
//
// Opciones:
//   --apply     Ejecuta la actualizacion (sin ella es dry-run)
//   --confirm   Obligatorio si DATABASE_URL no es localhost

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const TIER_LEGACY = "essential"
const TIER_DESTINO = "starter"

async function main() {
  const argv = process.argv.slice(2)
  const apply = argv.includes("--apply")
  const confirm = argv.includes("--confirm")
  const desconocidas = argv.filter((a) => !["--apply", "--confirm", "--dry-run"].includes(a))
  if (desconocidas.length > 0) {
    console.error(`❌ Opción desconocida: ${desconocidas.join(", ")}`)
    process.exit(1)
  }

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

  console.log(`🔧 Normalización de tier legacy "${TIER_LEGACY}" → "${TIER_DESTINO}"`)
  console.log(`   Base de datos: ${dbHost} ${esLocal ? "(local)" : "(REMOTA)"}`)
  console.log(`   Modo: ${apply ? "APLICAR CAMBIOS" : "dry-run (no modifica nada)"}`)

  if (!esLocal && !confirm) {
    console.error("\n❌ DATABASE_URL apunta a una base de datos remota.")
    console.error("   Añade --confirm para ejecutar contra esta base de datos.")
    process.exit(1)
  }

  const clubes = await prisma.club.findMany({
    where: { subscriptionTier: TIER_LEGACY },
    select: { name: true, slug: true, subscriptionStatus: true },
    orderBy: { name: "asc" },
  })

  if (clubes.length === 0) {
    console.log(`\n✅ Ningún club con tier "${TIER_LEGACY}". Nada que hacer.`)
    return
  }

  console.log(`\nClubes a normalizar (${clubes.length}):`)
  for (const club of clubes) {
    console.log(`   - ${club.name} (${club.slug}) [status: ${club.subscriptionStatus ?? "sin estado"}] ${TIER_LEGACY} → ${TIER_DESTINO}`)
  }

  if (!apply) {
    console.log("\nℹ️  Dry-run: no se ha modificado nada. Ejecuta con --apply para aplicar.")
    return
  }

  const resultado = await prisma.club.updateMany({
    where: { subscriptionTier: TIER_LEGACY },
    data: { subscriptionTier: TIER_DESTINO },
  })
  console.log(`\n✅ ${resultado.count} club(es) actualizados a "${TIER_DESTINO}"`)

  const restantes = await prisma.club.count({ where: { subscriptionTier: TIER_LEGACY } })
  if (restantes > 0) {
    console.error(`⚠️  Quedan ${restantes} club(es) con tier "${TIER_LEGACY}" (revisar manualmente)`)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
