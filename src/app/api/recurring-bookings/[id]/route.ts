import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { validarBody } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { registrarAuditoria } from "@/lib/audit"
import * as z from "zod"

const RecurringBookingUpdateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startHour: z.number().int().min(0).max(23).optional(),
  startMinute: z.number().int().min(0).max(59).optional(),
  endHour: z.number().int().min(0).max(23).optional(),
  endMinute: z.number().int().min(0).max(59).optional(),
  courtId: z.string().optional(),
  userId: z.string().nullable().optional(),
  guestName: z.string().max(100).nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
  endsAt: z.string().optional(),
})

// GET: Obtener una reserva recurrente
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth("recurring-bookings:read")
    if (isAuthError(auth)) return auth
    const { id } = await params

    const recurringBooking = await db.recurringBooking.findFirst({
      where: { id, clubId: auth.session.user.clubId },
      include: {
        court: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!recurringBooking) {
      return NextResponse.json({ error: "Reserva recurrente no encontrada." }, { status: 404 })
    }

    return NextResponse.json(recurringBooking)
  } catch (error) {
    logger.error("RECURRING_BOOKINGS", "Error al obtener reserva recurrente", {}, error as Error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// PATCH: Actualizar reserva recurrente
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth("recurring-bookings:update")
    if (isAuthError(auth)) return auth
    const { id } = await params
    const clubId = auth.session.user.clubId

    const existing = await db.recurringBooking.findFirst({
      where: { id, clubId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Reserva recurrente no encontrada." }, { status: 404 })
    }

    const body = await req.json()
    const result = validarBody(RecurringBookingUpdateSchema, body)
    if (!result.success) return result.response
    const data = result.data

    // Verificar pista si se cambia
    if (data.courtId) {
      const court = await db.court.findFirst({
        where: { id: data.courtId, clubId },
      })
      if (!court) {
        return NextResponse.json({ error: "Pista no encontrada en tu club." }, { status: 404 })
      }
    }

    // Verificar usuario si se cambia
    if (data.userId) {
      const user = await db.user.findFirst({
        where: { id: data.userId, clubId },
      })
      if (!user) {
        return NextResponse.json({ error: "Socio no encontrado en tu club." }, { status: 404 })
      }
    }

    const updated = await db.recurringBooking.update({
      where: { id },
      data: {
        ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
        ...(data.startHour !== undefined && { startHour: data.startHour }),
        ...(data.startMinute !== undefined && { startMinute: data.startMinute }),
        ...(data.endHour !== undefined && { endHour: data.endHour }),
        ...(data.endMinute !== undefined && { endMinute: data.endMinute }),
        ...(data.courtId !== undefined && { courtId: data.courtId }),
        ...(data.userId !== undefined && { userId: data.userId }),
        ...(data.guestName !== undefined && { guestName: data.guestName }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.endsAt !== undefined && { endsAt: new Date(data.endsAt) }),
      },
      include: {
        court: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    logger.info("RECURRING_BOOKINGS", "Reserva recurrente actualizada", { id, clubId })

    registrarAuditoria({
      recurso: "recurring-booking",
      accion: "actualizar",
      entidadId: id,
      detalles: { campos: Object.keys(data) },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId,
    })

    return NextResponse.json(updated)
  } catch (error) {
    logger.error("RECURRING_BOOKINGS", "Error al actualizar reserva recurrente", {}, error as Error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// DELETE: Eliminar reserva recurrente (las reservas generadas se mantienen)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth("recurring-bookings:delete")
    if (isAuthError(auth)) return auth
    const { id } = await params

    const existing = await db.recurringBooking.findFirst({
      where: { id, clubId: auth.session.user.clubId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Reserva recurrente no encontrada." }, { status: 404 })
    }

    await db.recurringBooking.delete({ where: { id } })

    logger.info("RECURRING_BOOKINGS", "Reserva recurrente eliminada", {
      id,
      clubId: auth.session.user.clubId,
    })

    registrarAuditoria({
      recurso: "recurring-booking",
      accion: "eliminar",
      entidadId: id,
      detalles: { descripcion: existing.description },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error("RECURRING_BOOKINGS", "Error al eliminar reserva recurrente", {}, error as Error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
