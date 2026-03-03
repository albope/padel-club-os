import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { validarBody } from "@/lib/validation"
import { canCreateRecurringBooking } from "@/lib/subscription"
import { logger } from "@/lib/logger"
import * as z from "zod"

const RecurringBookingCreateSchema = z.object({
  courtId: z.string().min(1, "El ID de pista es requerido."),
  dayOfWeek: z.number().int().min(0, "Dia invalido.").max(6, "Dia invalido."),
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59).default(0),
  endHour: z.number().int().min(0).max(23),
  endMinute: z.number().int().min(0).max(59).default(0),
  userId: z.string().optional(),
  guestName: z.string().max(100, "El nombre no puede superar 100 caracteres.").optional(),
  description: z.string().max(200, "La descripcion no puede superar 200 caracteres.").optional(),
  startsAt: z.string().min(1, "La fecha de inicio es requerida."),
  endsAt: z.string().min(1, "La fecha de fin es requerida."),
}).refine(
  (d) => d.userId || d.guestName,
  { message: "Se requiere un socio o nombre de invitado.", path: ["userId"] }
).refine(
  (d) => {
    const startMin = d.startHour * 60 + d.startMinute
    const endMin = d.endHour * 60 + d.endMinute
    return endMin > startMin
  },
  { message: "La hora de fin debe ser posterior a la de inicio.", path: ["endHour"] }
).refine(
  (d) => new Date(d.endsAt) > new Date(d.startsAt),
  { message: "La fecha fin debe ser posterior a la fecha inicio.", path: ["endsAt"] }
)

// GET: Listar reservas recurrentes del club
export async function GET() {
  try {
    const auth = await requireAuth("recurring-bookings:read")
    if (isAuthError(auth)) return auth

    const recurringBookings = await db.recurringBooking.findMany({
      where: { clubId: auth.session.user.clubId },
      include: {
        court: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
    })

    return NextResponse.json(recurringBookings)
  } catch (error) {
    logger.error("RECURRING_BOOKINGS", "Error al listar reservas recurrentes", {}, error as Error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST: Crear nueva reserva recurrente
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("recurring-bookings:create", { requireSubscription: true })
    if (isAuthError(auth)) return auth
    const clubId = auth.session.user.clubId

    const body = await req.json()
    const result = validarBody(RecurringBookingCreateSchema, body)
    if (!result.success) return result.response
    const data = result.data

    // Verificar gating por plan
    const canCreate = await canCreateRecurringBooking(clubId)
    if (!canCreate.allowed) {
      return NextResponse.json({ error: canCreate.reason }, { status: 403 })
    }

    // Verificar que la pista pertenece al club
    const court = await db.court.findFirst({
      where: { id: data.courtId, clubId },
    })
    if (!court) {
      return NextResponse.json({ error: "Pista no encontrada en tu club." }, { status: 404 })
    }

    // Verificar que el usuario pertenece al club (si se especifica)
    if (data.userId) {
      const user = await db.user.findFirst({
        where: { id: data.userId, clubId },
      })
      if (!user) {
        return NextResponse.json({ error: "Socio no encontrado en tu club." }, { status: 404 })
      }
    }

    const recurringBooking = await db.recurringBooking.create({
      data: {
        description: data.description || null,
        dayOfWeek: data.dayOfWeek,
        startHour: data.startHour,
        startMinute: data.startMinute,
        endHour: data.endHour,
        endMinute: data.endMinute,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        courtId: data.courtId,
        userId: data.userId || null,
        guestName: data.guestName || null,
        clubId,
      },
      include: {
        court: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    logger.info("RECURRING_BOOKINGS", "Reserva recurrente creada", {
      id: recurringBooking.id,
      clubId,
      dayOfWeek: data.dayOfWeek,
    })

    return NextResponse.json(recurringBooking, { status: 201 })
  } catch (error) {
    logger.error("RECURRING_BOOKINGS", "Error al crear reserva recurrente", {}, error as Error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
