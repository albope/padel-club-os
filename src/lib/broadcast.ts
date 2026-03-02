import { db } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import { enviarEmailBroadcast } from "@/lib/email"
import { logger } from "@/lib/logger"
import { Prisma } from "@prisma/client"

/**
 * Resuelve un string de segmento a un filtro Prisma para usuarios.
 * Segmentos soportados: "all", "active", "inactive", "level:X"
 */
export function resolverSegmento(segmento: string, clubId: string): Prisma.UserWhereInput {
  const base: Prisma.UserWhereInput = { clubId, role: "PLAYER" }

  if (segmento === "all") return base
  if (segmento === "active") return { ...base, isActive: true }
  if (segmento === "inactive") return { ...base, isActive: false }
  if (segmento.startsWith("level:")) {
    const nivel = segmento.split(":")[1]
    return { ...base, isActive: true, level: nivel }
  }
  return base
}

/**
 * Envia un broadcast a los usuarios que coinciden con el segmento.
 * Procesa en lotes de 10 para no saturar servicios (push + email).
 * Actualiza el estado del broadcast en DB al finalizar.
 */
export async function enviarBroadcast(params: {
  broadcastId: string
  clubId: string
  clubNombre: string
  clubSlug: string
  titulo: string
  mensaje: string
  canales: string
  segmento: string
}) {
  const where = resolverSegmento(params.segmento, params.clubId)
  const usuarios = await db.user.findMany({
    where,
    select: { id: true, email: true, name: true },
  })

  const BATCH_SIZE = 10
  const incluirPush = params.canales.includes("push")
  const incluirEmail = params.canales.includes("email")

  for (let i = 0; i < usuarios.length; i += BATCH_SIZE) {
    const lote = usuarios.slice(i, i + BATCH_SIZE)

    await Promise.allSettled(
      lote.map(async (usuario) => {
        // In-app + push (via crearNotificacion existente)
        if (incluirPush) {
          await crearNotificacion({
            tipo: "club_announcement",
            titulo: params.titulo,
            mensaje: params.mensaje,
            userId: usuario.id,
            clubId: params.clubId,
            metadata: { broadcastId: params.broadcastId },
          })
        }

        // Email
        if (incluirEmail && usuario.email) {
          await enviarEmailBroadcast({
            email: usuario.email,
            nombre: usuario.name,
            titulo: params.titulo,
            mensaje: params.mensaje,
            clubNombre: params.clubNombre,
            clubSlug: params.clubSlug,
          }).catch(() => {}) // fire-and-forget por email individual
        }
      })
    )

    // Delay entre lotes si incluye email (rate limit Resend)
    if (incluirEmail && i + BATCH_SIZE < usuarios.length) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  // Actualizar estado del broadcast
  await db.broadcast.update({
    where: { id: params.broadcastId },
    data: { status: "sent" },
  }).catch(() => {})
}
