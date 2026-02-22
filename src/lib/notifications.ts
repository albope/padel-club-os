import { db } from "@/lib/db"
import { enviarPush, type PushPayload } from "@/lib/web-push"

// Tipos de notificacion soportados
export type TipoNotificacion =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder"
  | "open_match_created"
  | "open_match_full"
  | "open_match_joined"
  | "news_published"
  | "competition_result"

interface CrearNotificacionParams {
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  userId: string
  clubId: string
  metadata?: Record<string, unknown>
  url?: string
}

/**
 * Crea una notificacion en DB y envia push a todas las suscripciones del usuario.
 * No lanza excepciones - los errores de push se registran en consola.
 */
export async function crearNotificacion({
  tipo,
  titulo,
  mensaje,
  userId,
  clubId,
  metadata,
  url,
}: CrearNotificacionParams) {
  try {
    // 1. Guardar en DB
    const notificacion = await db.notification.create({
      data: {
        type: tipo,
        title: titulo,
        message: mensaje,
        userId,
        clubId,
        metadata: metadata ? { ...metadata, url } : url ? { url } : undefined,
      },
    })

    // 2. Enviar push a todas las suscripciones del usuario
    const suscripciones = await db.pushSubscription.findMany({
      where: { userId },
    })

    if (suscripciones.length > 0) {
      const payload: PushPayload = {
        title: titulo,
        message: mensaje,
        url: url || "/",
        tag: `${tipo}-${notificacion.id}`,
      }

      await Promise.allSettled(
        suscripciones.map(async (sub) => {
          const exito = await enviarPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload
          )
          // Si la suscripcion expiro, eliminarla
          if (!exito) {
            await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          }
        })
      )
    }

    return notificacion
  } catch (error) {
    console.error("[CREAR_NOTIFICACION_ERROR]", error)
    return null
  }
}

/**
 * Notificar a todos los jugadores de un club (para noticias, eventos globales).
 * Crea una notificacion por cada jugador.
 */
export async function notificarClub({
  tipo,
  titulo,
  mensaje,
  clubId,
  metadata,
  url,
  excluirUserId,
}: Omit<CrearNotificacionParams, "userId"> & { excluirUserId?: string }) {
  try {
    const jugadores = await db.user.findMany({
      where: {
        clubId,
        role: "PLAYER",
        ...(excluirUserId ? { id: { not: excluirUserId } } : {}),
      },
      select: { id: true },
    })

    // Procesar en lotes de 10 para no saturar
    const BATCH_SIZE = 10
    for (let i = 0; i < jugadores.length; i += BATCH_SIZE) {
      const lote = jugadores.slice(i, i + BATCH_SIZE)
      await Promise.allSettled(
        lote.map((jugador) =>
          crearNotificacion({
            tipo,
            titulo,
            mensaje,
            userId: jugador.id,
            clubId,
            metadata,
            url,
          })
        )
      )
    }
  } catch (error) {
    console.error("[NOTIFICAR_CLUB_ERROR]", error)
  }
}
