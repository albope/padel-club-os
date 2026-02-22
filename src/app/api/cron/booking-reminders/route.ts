import { db } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
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
        club: { select: { slug: true } },
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

        // Marcar como recordatorio enviado
        await db.booking.update({
          where: { id: reserva.id },
          data: { reminderSentAt: new Date() },
        })

        enviados++
      } catch (error) {
        console.error(`[BOOKING_REMINDER_ERROR] Reserva ${reserva.id}:`, error)
        errores++
      }
    }

    console.log(`[BOOKING_REMINDERS] Procesadas: ${reservas.length}, Enviadas: ${enviados}, Errores: ${errores}`)

    return NextResponse.json({
      procesadas: reservas.length,
      enviadas: enviados,
      errores,
    })
  } catch (error) {
    console.error("[CRON_BOOKING_REMINDERS_ERROR]", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
