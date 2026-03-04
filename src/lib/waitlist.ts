import { db } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import { enviarEmailSlotLiberado } from "@/lib/email"
import { logger } from "@/lib/logger"

interface LiberarSlotParams {
  courtId: string
  startTime: Date
  endTime: Date
  clubId: string
  clubSlug: string
  clubNombre: string
  pistaNombre: string
}

/**
 * Funcion de dominio centralizada: cuando un slot se libera (cancelacion, delete, auto-cancel),
 * notifica a todos los usuarios en la lista de espera de ese slot.
 *
 * Debe llamarse desde TODOS los flujos que liberan un slot:
 * - Cancelacion jugador (soft cancel)
 * - Eliminacion admin (hard delete)
 * - Auto-cancel cron (pago expirado)
 */
export async function liberarSlotYNotificar({
  courtId,
  startTime,
  endTime,
  clubId,
  clubSlug,
  clubNombre,
  pistaNombre,
}: LiberarSlotParams): Promise<void> {
  try {
    // Buscar entradas activas en la lista de espera para este slot exacto
    const entradas = await db.bookingWaitlist.findMany({
      where: {
        courtId,
        startTime,
        status: "active",
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "asc" }, // FIFO
    })

    if (entradas.length === 0) return

    // Notificar a todos (el primero en reservar gana)
    const BATCH_SIZE = 10
    for (let i = 0; i < entradas.length; i += BATCH_SIZE) {
      const lote = entradas.slice(i, i + BATCH_SIZE)
      await Promise.allSettled(
        lote.map(async (entrada) => {
          // Notificacion in-app + push
          await crearNotificacion({
            tipo: "waitlist_slot_available",
            titulo: "¡Horario liberado!",
            mensaje: `Se ha liberado ${pistaNombre} el ${startTime.toLocaleDateString("es-ES", { day: "numeric", month: "long", timeZone: "Europe/Madrid" })} a las ${startTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })}. ¡Reserva rápido!`,
            userId: entrada.user.id,
            clubId,
            metadata: { courtId, startTime: startTime.toISOString() },
            url: `/club/${clubSlug}/reservar`,
          })

          // Email (fire-and-forget)
          if (entrada.user.email) {
            enviarEmailSlotLiberado({
              email: entrada.user.email,
              nombre: entrada.user.name || "Jugador",
              pistaNombre,
              fechaHoraInicio: startTime,
              clubNombre,
              clubSlug,
            }).catch((err) => {
              logger.error("WAITLIST_EMAIL", "Error enviando email de slot liberado", { userId: entrada.user.id }, err)
            })
          }

          // Marcar como notificado
          await db.bookingWaitlist.update({
            where: { id: entrada.id },
            data: { status: "notified", notifiedAt: new Date() },
          })
        })
      )
    }

    logger.info("WAITLIST_NOTIFICAR", `Notificados ${entradas.length} usuarios en lista de espera`, {
      courtId,
      startTime: startTime.toISOString(),
      clubId,
    })

    // Limpiar entradas expiradas (slots ya pasados) del club — fire-and-forget
    db.bookingWaitlist.updateMany({
      where: {
        clubId,
        startTime: { lt: new Date() },
        status: "active",
      },
      data: { status: "expired" },
    }).catch(() => {})
  } catch (error) {
    logger.error("WAITLIST_NOTIFICAR", "Error al notificar lista de espera", { courtId, clubId }, error)
  }
}

/**
 * Limpia la lista de espera cuando un slot vuelve a ocuparse (nueva reserva).
 * - El usuario que reservo: fulfilled
 * - El resto: expired
 */
export async function limpiarWaitlistAlReservar({
  courtId,
  startTime,
  userId,
}: {
  courtId: string
  startTime: Date
  userId?: string
}): Promise<void> {
  try {
    // Marcar fulfilled si el usuario que reservo estaba en la waitlist
    if (userId) {
      await db.bookingWaitlist.updateMany({
        where: { courtId, startTime, userId, status: { in: ["active", "notified"] } },
        data: { status: "fulfilled" },
      }).catch(() => {})
    }

    // Marcar expired para el resto
    await db.bookingWaitlist.updateMany({
      where: {
        courtId,
        startTime,
        status: { in: ["active", "notified"] },
        ...(userId ? { userId: { not: userId } } : {}),
      },
      data: { status: "expired" },
    }).catch(() => {})
  } catch (error) {
    logger.error("WAITLIST_LIMPIAR", "Error al limpiar waitlist al reservar", { courtId }, error)
  }
}
