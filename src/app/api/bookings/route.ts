import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// GET function to fetch all bookings
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
      }
    });
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("[GET_BOOKINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST function to create a new booking with overlap check
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { courtId, userId, startTime, endTime } = body;

    if (!courtId || !userId || !startTime || !endTime) {
      return new NextResponse("Missing required fields", { status: 400 });
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
        userId,
        startTime: newStartTime,
        endTime: newEndTime,
        totalPrice: 20.0,
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