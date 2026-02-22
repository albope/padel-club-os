import crypto from "crypto"
import { db } from "@/lib/db"

const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hora

/**
 * Genera un hash SHA-256 de un token.
 * Se almacena el hash en la DB, nunca el token en texto plano.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

/**
 * Genera un token aleatorio seguro de 32 bytes (64 caracteres hex).
 */
export function generarTokenAleatorio(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Crea un token de recuperacion de contrasena.
 * 1. Elimina tokens previos para ese email
 * 2. Genera un token aleatorio
 * 3. Almacena el hash del token en la DB
 * 4. Retorna el token en texto plano (para enviarlo por email)
 */
export async function crearTokenRecuperacion(email: string): Promise<string> {
  // Eliminar tokens anteriores para este email
  await db.passwordResetToken.deleteMany({
    where: { email },
  })

  const tokenPlano = generarTokenAleatorio()
  const tokenHash = hashToken(tokenPlano)
  const expires = new Date(Date.now() + TOKEN_EXPIRY_MS)

  await db.passwordResetToken.create({
    data: {
      email,
      token: tokenHash,
      expires,
    },
  })

  return tokenPlano
}

/**
 * Verifica un token de recuperacion.
 * Busca por hash, comprueba expiracion.
 * Retorna el email asociado o null si es invalido/expirado.
 */
export async function verificarTokenRecuperacion(
  tokenPlano: string
): Promise<string | null> {
  const tokenHash = hashToken(tokenPlano)

  const registro = await db.passwordResetToken.findUnique({
    where: { token: tokenHash },
  })

  if (!registro) return null

  if (registro.expires < new Date()) {
    // Token expirado, eliminarlo
    await db.passwordResetToken.delete({ where: { id: registro.id } })
    return null
  }

  return registro.email
}

/**
 * Elimina un token usado tras resetear la contrasena.
 */
export async function eliminarTokenRecuperacion(tokenPlano: string): Promise<void> {
  const tokenHash = hashToken(tokenPlano)
  await db.passwordResetToken.deleteMany({
    where: { token: tokenHash },
  })
}
