import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// PATCH: Actualizar una reserva con deteccion de solapamiento
export async function PATCH(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const auth = await requireAuth("bookings:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { courtId, userId, startTime, endTime } = body;

    if (!params.bookingId) {
      return new NextResponse("ID de reserva requerido", { status: 400 });
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId,
        id: { not: params.bookingId },
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

    await db.booking.delete({
      where: { id: params.bookingId, clubId: auth.session.user.clubId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE_BOOKING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
