import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// GET: Obtener todas las reservas del club
export async function GET() {
  try {
    const auth = await requireAuth("bookings:read")
    if (isAuthError(auth)) return auth

    const bookings = await db.booking.findMany({
      where: { clubId: auth.session.user.clubId },
      include: {
        user: { select: { name: true } },
        court: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("[GET_BOOKINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Crear una nueva reserva con deteccion de solapamiento
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("bookings:create")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { courtId, userId, guestName, startTime, endTime } = body;

    if (!courtId || (!userId && !guestName) || !startTime || !endTime) {
      return new NextResponse("Faltan campos requeridos.", { status: 400 });
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId,
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    });

    if (overlappingBooking) {
      return new NextResponse("Este horario ya está ocupado en la pista seleccionada.", { status: 409 });
    }

    const newBooking = await db.booking.create({
      data: {
        courtId,
        userId: userId || null,
        guestName: guestName || null,
        startTime: newStartTime,
        endTime: newEndTime,
        totalPrice: 20.0,
        status: "confirmed",
        clubId: auth.session.user.clubId,
      },
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("[CREATE_BOOKING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
