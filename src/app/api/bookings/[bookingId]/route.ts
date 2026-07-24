import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { liberarSlotYNotificar } from "@/lib/waitlist";
import { verificarBloqueo } from "@/lib/court-blocks";
import { registrarAuditoria } from "@/lib/audit";
import * as z from "zod";
import { respuestaErrorReserva, validarRangoReserva } from "@/lib/booking-domain";
import { calcularPrecioReserva } from "@/lib/pricing";

const BookingUpdateSchema = z.object({
  courtId: z.string().min(1, "El ID de pista es requerido."),
  userId: z.string().optional().nullable(),
  startTime: z.string().min(1, "La hora de inicio es requerida."),
  endTime: z.string().min(1, "La hora de fin es requerida."),
})

// PATCH: Actualizar una reserva con deteccion de solapamiento
export async function PATCH(req: Request, props: { params: Promise<{ bookingId: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAuth("bookings:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(BookingUpdateSchema, body);
    if (!result.success) return result.response;
    const { courtId, userId, startTime, endTime } = result.data;

    if (!params.bookingId) {
      return new NextResponse("ID de reserva requerido", { status: 400 });
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    // Validar que la pista pertenece al club del admin
    const court = await db.court.findFirst({
      where: { id: courtId, clubId: auth.session.user.clubId },
      include: {
        club: {
          select: {
            timezone: true,
            openingTime: true,
            closingTime: true,
            bookingDuration: true,
            maxAdvanceBooking: true,
          },
        },
      },
    });
    if (!court) {
      return new NextResponse("Pista no encontrada en este club.", { status: 404 });
    }
    validarRangoReserva({
      startTime: newStartTime,
      endTime: newEndTime,
      policy: court.club,
      requireFuture: true,
    })

    if (userId) {
      const membership = await db.clubMembership.findUnique({
        where: {
          userId_clubId: {
            userId,
            clubId: auth.session.user.clubId,
          },
        },
        select: { status: true },
      })
      if (membership?.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "El socio seleccionado no pertenece activamente a este club." },
          { status: 400 },
        )
      }
    }

    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId,
        clubId: auth.session.user.clubId,
        id: { not: params.bookingId },
        status: { not: "cancelled" },
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    });

    if (overlappingBooking) {
      return new NextResponse("El nuevo horario se solapa con otra reserva existente.", { status: 409 });
    }

    // Verificar bloqueo de pista
    const bloqueo = await verificarBloqueo(auth.session.user.clubId, courtId, newStartTime, newEndTime);
    if (bloqueo) {
      return NextResponse.json(
        { error: `La pista esta bloqueada en ese horario (${bloqueo.reason}${bloqueo.note ? `: ${bloqueo.note}` : ""}).` },
        { status: 409 }
      );
    }

    const totalPrice = await calcularPrecioReserva(
      courtId,
      auth.session.user.clubId,
      newStartTime,
      newEndTime,
    )
    const updatedBooking = await db.booking.update({
      where: { id: params.bookingId, clubId: auth.session.user.clubId },
      data: {
        courtId,
        userId,
        startTime: newStartTime,
        endTime: newEndTime,
        totalPrice,
      },
    });

    registrarAuditoria({
      recurso: "booking",
      accion: "actualizar",
      entidadId: params.bookingId,
      detalles: { campos: Object.keys(result.data) },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return NextResponse.json(updatedBooking);
  } catch (error) {
    const domainError = respuestaErrorReserva(error)
    if (domainError) {
      return NextResponse.json(
        { error: domainError.message, code: domainError.code },
        { status: domainError.status },
      )
    }
    logger.error("BOOKING_UPDATE", "Error al actualizar reserva", { ruta: "/api/bookings/[bookingId]" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Cancelar una reserva (soft delete para preservar Payment/BookingPayment)
export async function DELETE(req: Request, props: { params: Promise<{ bookingId: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAuth("bookings:delete")
    if (isAuthError(auth)) return auth

    if (!params.bookingId) {
      return new NextResponse("ID de reserva requerido", { status: 400 });
    }

    // Leer datos antes de cancelar para notificar waitlist
    const reserva = await db.booking.findUnique({
      where: { id: params.bookingId, clubId: auth.session.user.clubId },
      select: {
        status: true,
        courtId: true,
        startTime: true,
        endTime: true,
        court: { select: { name: true } },
        club: { select: { slug: true, name: true } },
      },
    })

    if (!reserva) {
      return new NextResponse("Reserva no encontrada", { status: 404 })
    }

    if (reserva.status === "cancelled") {
      return new NextResponse("La reserva ya esta cancelada", { status: 400 })
    }

    // Cancelacion blanda: preserva Payment y BookingPayment para auditoria
    await db.booking.update({
      where: { id: params.bookingId, clubId: auth.session.user.clubId },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "Eliminada por administrador",
      },
    });

    registrarAuditoria({
      recurso: "booking",
      accion: "cancelar",
      entidadId: params.bookingId,
      detalles: { pistaId: reserva.courtId, fecha: reserva.startTime },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    // Notificar lista de espera si la reserva era futura
    if (new Date(reserva.startTime) > new Date()) {
      liberarSlotYNotificar({
        courtId: reserva.courtId,
        startTime: reserva.startTime,
        endTime: reserva.endTime,
        clubId: auth.session.user.clubId,
        clubSlug: reserva.club?.slug || "",
        clubNombre: reserva.club?.name || "",
        pistaNombre: reserva.court?.name || "Pista",
      }).catch(() => {})
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("BOOKING_DELETE", "Error al cancelar reserva", { ruta: "/api/bookings/[bookingId]" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
