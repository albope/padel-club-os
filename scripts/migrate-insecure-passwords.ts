/**
 * Script de migracion: marca mustResetPassword=true para usuarios
 * que tengan la contrasena por defecto 'padel123'.
 *
 * Uso: npx tsx scripts/migrate-insecure-passwords.ts
 *
 * Este script:
 * 1. Busca todos los usuarios PLAYER con password
 * 2. Compara cada uno contra 'padel123' con bcrypt
 * 3. Marca mustResetPassword=true a los que coincidan
 * 4. Reporta resultados
 */

import { PrismaClient } from "@prisma/client"
import { compare } from "bcrypt"

const PASSWORD_INSEGURO = "padel123"

async function main() {
  const db = new PrismaClient()

  try {
    console.log("Buscando usuarios PLAYER con password...")

    const players = await db.user.findMany({
      where: {
        role: "PLAYER",
        password: { not: null },
        mustResetPassword: false,
      },
      select: { id: true, email: true, password: true },
    })

    console.log(`Encontrados ${players.length} usuarios PLAYER con password activo.`)

    let marcados = 0
    let seguros = 0

    for (const player of players) {
      if (!player.password) continue

      const esInseguro = await compare(PASSWORD_INSEGURO, player.password)

      if (esInseguro) {
        await db.user.update({
          where: { id: player.id },
          data: { mustResetPassword: true },
        })
        marcados++
        console.log(`  [INSEGURO] ${player.email} -> mustResetPassword=true`)
      } else {
        seguros++
      }
    }

    console.log("\n--- Resumen ---")
    console.log(`Total analizados: ${players.length}`)
    console.log(`Marcados para reset: ${marcados}`)
    console.log(`Password seguro: ${seguros}`)

    if (marcados > 0) {
      console.log("\nEstos usuarios deberan restablecer su contrasena en el proximo login.")
      console.log("Se les enviara automaticamente un email de activacion.")
    } else {
      console.log("\nNo se encontraron usuarios con la contrasena por defecto.")
    }
  } finally {
    await db.$disconnect()
  }
}

main().catch((err) => {
  console.error("Error en migracion:", err)
  process.exit(1)
})
