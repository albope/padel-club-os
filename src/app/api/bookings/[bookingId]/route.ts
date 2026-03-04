import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { liberarSlotYNotificar } from "@/lib/waitlist";
import * as z from "zod";

const BookingUpdateSchema = z.object({
  courtId: z.string().min(1, "El ID de pista es requerido."),
  userId: z.string().optional().nullable(),
  startTime: z.string().min(1, "La hora de inicio es requerida."),
  endTime: z.string().min(1, "La hora de fin es requerida."),
})

// PATCH: Actualizar una reserva con deteccion de solapamiento
export async function PATCH(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
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
    });
    if (!court) {
      return new NextResponse("Pista no encontrada en este club.", { status: 404 });
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

    const updatedBooking = await db.booking.update({
      where: { id: params.bookingId, clubId: auth.session.user.clubId },
      data: { courtId, userId, startTime: newStartTime, endTime: newEndTime },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("[UPDATE_BOOKING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Eliminar una reserva
export async function DELETE(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const auth = await requireAuth("bookings:delete")
    if (isAuthError(auth)) return auth

    if (!params.bookingId) {
      return new NextResponse("ID de reserva requerido", { status: 400 });
    }

    // Leer datos antes de eliminar para notificar waitlist
    const reserva = await db.booking.findUnique({
      where: { id: params.bookingId, clubId: auth.session.user.clubId },
      select: {
        courtId: true,
        startTime: true,
        endTime: true,
        court: { select: { name: true } },
        club: { select: { slug: true, name: true } },
      },
    })

    await db.booking.delete({
      where: { id: params.bookingId, clubId: auth.session.user.clubId },
    });

    // Notificar lista de espera si la reserva era futura
    if (reserva && new Date(reserva.startTime) > new Date()) {
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
    console.error("[DELETE_BOOKING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
