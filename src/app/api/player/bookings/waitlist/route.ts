import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { validarBody } from "@/lib/validation"
import { logger } from "@/lib/logger"
import * as z from "zod"

const WaitlistCreateSchema = z.object({
  courtId: z.string().min(1, "El ID de pista es requerido."),
  startTime: z.string().min(1, "La hora de inicio es requerida."),
  endTime: z.string().min(1, "La hora de fin es requerida."),
})

// GET: Mis entradas en lista de espera (activas y notificadas, futuras)
export async function GET() {
  try {
    const auth = await requireAuth("booking-waitlist:create")
    if (isAuthError(auth)) return auth

    const ahora = new Date()

    const entradas = await db.bookingWaitlist.findMany({
      where: {
        userId: auth.session.user.id,
        clubId: auth.session.user.clubId,
        status: { in: ["active", "notified"] },
        startTime: { gt: ahora },
      },
      include: {
        court: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    })

    return NextResponse.json(
      entradas.map((e) => ({
        id: e.id,
        courtId: e.courtId,
        courtName: e.court.name,
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
        status: e.status,
        createdAt: e.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    logger.error("WAITLIST_GET", "Error obteniendo lista de espera", { ruta: "/api/player/bookings/waitlist", metodo: "GET" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST: Apuntarse a lista de espera
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("booking-waitlist:create")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const result = validarBody(WaitlistCreateSchema, body)
    if (!result.success) return result.response

    const { courtId, startTime, endTime } = result.data
    const newStartTime = new Date(startTime)
    const newEndTime = new Date(endTime)

    // Verificar que el slot es en el futuro
    if (newStartTime <= new Date()) {
      return NextResponse.json(
        { error: "No puedes apuntarte a la lista de espera de un slot pasado." },
        { status: 400 }
      )
    }

    // Verificar que la pista pertenece al club
    const court = await db.court.findFirst({
      where: { id: courtId, clubId: auth.session.user.clubId },
    })
    if (!court) {
      return NextResponse.json(
        { error: "Pista no encontrada." },
        { status: 404 }
      )
    }

    // Verificar que el slot esta realmente ocupado
    const ocupado = await db.booking.findFirst({
      where: {
        courtId,
        status: { not: "cancelled" },
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    })

    if (!ocupado) {
      return NextResponse.json(
        { error: "El slot está disponible, puedes reservarlo directamente." },
        { status: 400 }
      )
    }

    // Crear entrada (upsert para evitar duplicados)
    const entrada = await db.bookingWaitlist.upsert({
      where: {
        courtId_startTime_userId: {
          courtId,
          startTime: newStartTime,
          userId: auth.session.user.id,
        },
      },
      create: {
        courtId,
        startTime: newStartTime,
        endTime: newEndTime,
        userId: auth.session.user.id,
        clubId: auth.session.user.clubId,
      },
      update: {
        status: "active",
        notifiedAt: null,
      },
    })

    return NextResponse.json(
      { id: entrada.id, message: "Te avisaremos cuando se libere este horario." },
      { status: 201 }
    )
  } catch (error) {
    logger.error("WAITLIST_POST", "Error apuntandose a lista de espera", { ruta: "/api/player/bookings/waitlist", metodo: "POST" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
