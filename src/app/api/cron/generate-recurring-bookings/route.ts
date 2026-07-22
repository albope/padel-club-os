import { db } from "@/lib/db"
import { calcularPrecioReserva } from "@/lib/pricing"
import { crearNotificacion } from "@/lib/notifications"
import { isSubscriptionActive } from "@/lib/subscription"
import { verificarBloqueo } from "@/lib/court-blocks"
import { logger } from "@/lib/logger"
import { registrarAuditoria } from "@/lib/audit"
import { partesEnZonaClub, instanteDesdeZonaClub } from "@/lib/timezone"
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
    // "Hoy" segun el calendario del club (Europe/Madrid), no el del servidor (UTC)
    const hoyClub = partesEnZonaClub(ahora)
    const hoy = instanteDesdeZonaClub(hoyClub.year, hoyClub.month, hoyClub.day, 0, 0)
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

      // Recorrer los dias del lookahead segun el calendario del club
      for (let dia = 0; dia <= LOOKAHEAD_DAYS; dia++) {
        // Dia de la semana del calendario del club (Date.UTC normaliza day+dia)
        const diaSemanaCandidato = new Date(
          Date.UTC(hoyClub.year, hoyClub.month - 1, hoyClub.day + dia)
        ).getUTCDay()
        if (diaSemanaCandidato !== plantilla.dayOfWeek) continue

        // Rango de vigencia de la plantilla (comparado por dia completo)
        const inicioDia = instanteDesdeZonaClub(hoyClub.year, hoyClub.month, hoyClub.day + dia, 0, 0)
        if (inicioDia > new Date(plantilla.endsAt)) continue
        const finDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000)
        if (finDia <= new Date(plantilla.startsAt)) continue

        try {
          // Construir startTime y endTime en hora de pared del club
          const startTime = instanteDesdeZonaClub(
            hoyClub.year,
            hoyClub.month,
            hoyClub.day + dia,
            plantilla.startHour,
            plantilla.startMinute
          )
          const endTime = instanteDesdeZonaClub(
            hoyClub.year,
            hoyClub.month,
            hoyClub.day + dia,
            plantilla.endHour,
            plantilla.endMinute
          )

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
            fecha: inicioDia.toISOString(),
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

/** Formatea fecha a string legible en espanol */
function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Madrid",
  })
}

// Vercel Cron invoca los endpoints con GET
export { POST as GET }
