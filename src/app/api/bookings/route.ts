import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// GET function to fetch all bookings for the logged-in admin's club
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const bookings = await db.booking.findMany({
      where: { clubId: session.user.clubId },
      include: {
        user: { select: { name: true } },
        court: { select: { name: true } },
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("[GET_BOOKINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST function to create a new booking with guest logic and overlap check
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { courtId, userId, guestName, startTime, endTime } = body;

    // Validation: at least a userId or a guestName must be provided
    if (!courtId || (!userId && !guestName) || !startTime || !endTime) {
      return new NextResponse("Faltan campos requeridos.", { status: 400 });
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    // --- OVERLAP CHECK ---
    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId: courtId,
        AND: [
          { startTime: { lt: newEndTime } }, // An existing booking starts before the new one ends
          { endTime: { gt: newStartTime } },   // And it ends after the new one starts
        ],
      },
    });

    if (overlappingBooking) {
      return new NextResponse("Este horario ya está ocupado en la pista seleccionada.", { status: 409 }); // 409 Conflict
    }
    // --- END OF OVERLAP CHECK ---

    const newBooking = await db.booking.create({
      data: {
        courtId,
        userId: userId || null, // Use userId if provided, otherwise null
        guestName: guestName || null, // Use guestName if provided
        startTime: newStartTime,
        endTime: newEndTime,
        totalPrice: 20.0, // We'll use a fixed price for now
        status: "confirmed",
        clubId: session.user.clubId,
      },
    });

    return NextResponse.json(newBooking, { status: 201 });

  } catch (error) {
    console.error("[CREATE_BOOKING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}