import { db } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import { enviarEmailRecordatorioReserva } from "@/lib/email"
import { liberarSlotYNotificar } from "@/lib/waitlist"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

// Tiempo de antelacion para enviar recordatorio (1 hora)
const REMINDER_MINUTES = 60

/**
 * POST /api/cron/booking-reminders
 *
 * Cron job que envia recordatorios de reservas proximas.
 * Busca reservas confirmadas que empiezan en la proxima hora
 * y que aun no tienen recordatorio enviado.
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
    const limiteRecordatorio = new Date(ahora.getTime() + REMINDER_MINUTES * 60 * 1000)

    // Buscar reservas confirmadas que empiezan en la proxima hora,
    // que tienen usuario asignado y no se les ha enviado recordatorio
    const reservas = await db.booking.findMany({
      where: {
        status: "confirmed",
        startTime: {
          gt: ahora,
          lte: limiteRecordatorio,
        },
        reminderSentAt: null,
        userId: { not: null },
      },
      include: {
        court: { select: { name: true } },
        club: { select: { slug: true, name: true } },
        user: { select: { email: true, name: true } },
      },
    })

    let enviados = 0
    let errores = 0

    for (const reserva of reservas) {
      if (!reserva.userId) continue

      try {
        const hora = reserva.startTime.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Madrid",
        })

        await crearNotificacion({
          tipo: "booking_reminder",
          titulo: "Recordatorio de reserva",
          mensaje: `Tu reserva en ${reserva.court.name} es hoy a las ${hora}. ¡No llegues tarde!`,
          userId: reserva.userId,
          clubId: reserva.clubId,
          metadata: { bookingId: reserva.id },
          url: `/club/${reserva.club.slug}/reservar`,
        })

        // Enviar email de recordatorio
        if (reserva.user?.email) {
          enviarEmailRecordatorioReserva({
            email: reserva.user.email,
            nombre: reserva.user.name || "Jugador",
            pistaNombre: reserva.court.name,
            fechaHoraInicio: reserva.startTime,
            clubNombre: reserva.club.name,
            clubSlug: reserva.club.slug,
          }).catch((err) => {
            logger.error("BOOKING_REMINDER_EMAIL", "Error enviando email de recordatorio", { ruta: "/api/cron/booking-reminders", reservaId: reserva.id }, err)
          })
        }

        // Marcar como recordatorio enviado
        await db.booking.update({
          where: { id: reserva.id },
          data: { reminderSentAt: new Date() },
        })

        enviados++
      } catch (error) {
        logger.error("BOOKING_REMINDER", "Error procesando recordatorio", { ruta: "/api/cron/booking-reminders", reservaId: reserva.id }, error)
        errores++
      }
    }

    logger.info("BOOKING_REMINDERS", `Procesadas: ${reservas.length}, Enviadas: ${enviados}, Errores: ${errores}`)

    // Auto-cancelar reservas pendientes de pago online que llevan mas de 15 minutos
    const limiteExpiracion = new Date(ahora.getTime() - 15 * 60 * 1000)

    const reservasExpiradas = await db.booking.findMany({
      where: {
        status: "confirmed",
        paymentStatus: "pending",
        startTime: { lt: limiteExpiracion },
        // Solo cancelar si NO tienen un pago ya registrado
        payment: null,
        // Solo reservas que pertenecen a clubs con pagos online configurados
        club: {
          bookingPaymentMode: { in: ["online", "both"] },
          stripeConnectOnboarded: true,
        },
      },
      select: {
        id: true,
        courtId: true,
        startTime: true,
        endTime: true,
        clubId: true,
        court: { select: { name: true } },
        club: { select: { slug: true, name: true } },
      },
    })

    let canceladas = 0
    for (const reserva of reservasExpiradas) {
      try {
        await db.booking.update({
          where: { id: reserva.id },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelReason: "Pago no completado en el plazo de 15 minutos",
          },
        })
        canceladas++

        // Notificar lista de espera del slot liberado
        liberarSlotYNotificar({
          courtId: reserva.courtId,
          startTime: reserva.startTime,
          endTime: reserva.endTime,
          clubId: reserva.clubId,
          clubSlug: reserva.club?.slug || "",
          clubNombre: reserva.club?.name || "",
          pistaNombre: reserva.court?.name || "Pista",
        }).catch(() => {})
      } catch (cancelError) {
        logger.error("BOOKING_AUTO_CANCEL", "Error cancelando reserva expirada", { reservaId: reserva.id }, cancelError)
      }
    }

    if (canceladas > 0) {
      logger.info("BOOKING_AUTO_CANCEL", `Canceladas ${canceladas} reservas sin pago completado`)
    }

    return NextResponse.json({
      procesadas: reservas.length,
      enviadas: enviados,
      errores,
      canceladasPorPago: canceladas,
    })
  } catch (error) {
    logger.error("CRON_BOOKING_REMINDERS", "Error en cron de recordatorios", { ruta: "/api/cron/booking-reminders" }, error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
