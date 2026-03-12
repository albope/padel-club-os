import { db } from "@/lib/db"
import { calcularPrecioReserva } from "@/lib/pricing"
import { crearNotificacion } from "@/lib/notifications"
import { isSubscriptionActive } from "@/lib/subscription"
import { verificarBloqueo } from "@/lib/court-blocks"
import { logger } from "@/lib/logger"
import { registrarAuditoria } from "@/lib/audit"
import { NextResponse } from "next/server"

// Generar reservas hasta 7 dias en el futuro
const LOOKAHEAD_DAYS = 7

/**
 * POST /api/cron/generate-recurring-bookings
 *
 * Cron job diario que genera reservas a partir de plantillas recurrentes.
 * Para cada RecurringBooking activa, busca fechas en los proximos 7 dias
 * cuyo dia de la semana coincida y crea reservas si no existen.
 *
 * Seguridad: protegido por CRON_SECRET (Vercel Cron o llamada manual).
 */
export async function POST(req: Request) {
  try {
    // Verificar autorizacion
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const ahora = new Date()
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    const limiteFuturo = new Date(hoy.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000)

    // Buscar todas las reservas recurrentes activas dentro del rango de fechas
    const plantillas = await db.recurringBooking.findMany({
      where: {
        isActive: true,
        startsAt: { lte: limiteFuturo },
        endsAt: { gte: hoy },
      },
      include: {
        court: { select: { name: true } },
        user: { select: { name: true, email: true } },
        club: {
          select: {
            name: true,
            slug: true,
            subscriptionStatus: true,
            trialEndsAt: true,
          },
        },
      },
    })

    let generadas = 0
    let conflictos = 0
    let errores = 0
    let omitidas = 0
    let bloqueados = 0

    for (const plantilla of plantillas) {
      // Verificar suscripcion activa del club
      if (!isSubscriptionActive(plantilla.club.subscriptionStatus, plantilla.club.trialEndsAt)) {
        omitidas++
        continue
      }

      // Calcular fechas objetivo dentro del lookahead
      const fechasObjetivo = calcularFechasObjetivo(
        plantilla.dayOfWeek,
        hoy,
        limiteFuturo,
        new Date(plantilla.startsAt),
        new Date(plantilla.endsAt)
      )

      for (const fecha of fechasObjetivo) {
        try {
          // Construir startTime y endTime para esta fecha
          const startTime = new Date(fecha)
          startTime.setHours(plantilla.startHour, plantilla.startMinute, 0, 0)

          const endTime = new Date(fecha)
          endTime.setHours(plantilla.endHour, plantilla.endMinute, 0, 0)

          // No generar reservas en el pasado
          if (startTime <= ahora) continue

          // Verificar idempotencia: ya existe una reserva generada para esta fecha
          const yaExiste = await db.booking.findFirst({
            where: {
              recurringBookingId: plantilla.id,
              courtId: plantilla.courtId,
              startTime,
            },
          })
          if (yaExiste) continue

          // Verificar overlap con reservas existentes
          const overlap = await db.booking.findFirst({
            where: {
              courtId: plantilla.courtId,
              status: { not: "cancelled" },
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gt: startTime } },
              ],
            },
          })

          if (overlap) {
            conflictos++
            continue
          }

          // Verificar bloqueo de pista
          const bloqueo = await verificarBloqueo(plantilla.clubId, plantilla.courtId, startTime, endTime)
          if (bloqueo) {
            bloqueados++
            continue
          }

          // Calcular precio dinamico
          const totalPrice = await calcularPrecioReserva(
            plantilla.courtId,
            plantilla.clubId,
            startTime,
            endTime
          )

          // Crear la reserva
          const nuevaReserva = await db.booking.create({
            data: {
              courtId: plantilla.courtId,
              userId: plantilla.userId,
              guestName: plantilla.guestName,
              startTime,
              endTime,
              totalPrice,
              paymentStatus: "exempt",
              paymentMethod: "exempt",
              status: "confirmed",
              clubId: plantilla.clubId,
              recurringBookingId: plantilla.id,
            },
          })

          registrarAuditoria({
            recurso: "booking",
            accion: "crear",
            entidadId: nuevaReserva.id,
            detalles: { recurringBookingId: plantilla.id, pistaId: plantilla.courtId },
            userId: null,
            userName: null,
            origen: "cron",
            clubId: plantilla.clubId,
            clubName: plantilla.club?.name || null,
          })

          // Notificar al usuario asignado (fire-and-forget)
          if (plantilla.userId) {
            const hora = startTime.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Madrid",
            })
            crearNotificacion({
              tipo: "booking_confirmed",
              titulo: "Reserva recurrente generada",
              mensaje: `Tu clase fija en ${plantilla.court.name} ha sido reservada para el ${formatearFecha(startTime)} a las ${hora}.`,
              userId: plantilla.userId,
              clubId: plantilla.clubId,
              url: `/club/${plantilla.club.slug}/reservar`,
            }).catch(() => {})
          }

          generadas++
        } catch (error) {
          logger.error("RECURRING_BOOKINGS_CRON", "Error generando reserva individual", {
            plantillaId: plantilla.id,
            clubId: plantilla.clubId,
            fecha: fecha.toISOString(),
          }, error as Error)
          errores++
        }
      }
    }

    logger.info("RECURRING_BOOKINGS_CRON", `Procesadas: ${plantillas.length}, Generadas: ${generadas}, Conflictos: ${conflictos}, Bloqueados: ${bloqueados}, Omitidas: ${omitidas}, Errores: ${errores}`)

    return NextResponse.json({
      procesadas: plantillas.length,
      generadas,
      conflictos,
      bloqueados,
      omitidas,
      errores,
    })
  } catch (error) {
    logger.error("RECURRING_BOOKINGS_CRON", "Error en cron de reservas recurrentes", {}, error as Error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

/**
 * Calcula las fechas dentro del rango [hoy, limiteFuturo] que coinciden
 * con el dayOfWeek y estan dentro de [startsAt, endsAt].
 */
function calcularFechasObjetivo(
  dayOfWeek: number,
  hoy: Date,
  limiteFuturo: Date,
  startsAt: Date,
  endsAt: Date
): Date[] {
  const fechas: Date[] = []
  const inicio = new Date(Math.max(hoy.getTime(), startsAt.getTime()))
  const fin = new Date(Math.min(limiteFuturo.getTime(), endsAt.getTime()))

  const cursor = new Date(inicio)
  // Avanzar al primer dia que coincida con dayOfWeek
  while (cursor.getDay() !== dayOfWeek && cursor <= fin) {
    cursor.setDate(cursor.getDate() + 1)
  }

  // Recoger todas las fechas que coinciden
  while (cursor <= fin) {
    fechas.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }

  return fechas
}

/** Formatea fecha a string legible en espanol */
function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Madrid",
  })
}
