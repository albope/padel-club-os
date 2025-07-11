import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// PATCH function to update a booking with overlap check
export async function PATCH(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { courtId, userId, startTime, endTime } = body;

    if (!session?.user?.clubId || !params.bookingId) {
      return new NextResponse("Unauthorized or Missing ID", { status: 401 });
    }
    
    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    // --- OVERLAP CHECK ---
    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId: courtId,
        id: { not: params.bookingId }, // Exclude the current booking from the check
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    });

    if (overlappingBooking) {
      return new NextResponse("El nuevo horario se solapa con otra reserva existente.", { status: 409 });
    }
    // --- END OF OVERLAP CHECK ---

    const updatedBooking = await db.booking.update({
      where: { id: params.bookingId, clubId: session.user.clubId },
      data: { courtId, userId, startTime: newStartTime, endTime: newEndTime },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("[UPDATE_BOOKING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE function to remove a booking
export async function DELETE(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId || !params.bookingId) {
      return new NextResponse("Unauthorized or Missing ID", { status: 401 });
    }

    await db.booking.delete({
      where: {
        id: params.bookingId,
        clubId: session.user.clubId, // Security check
      },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error("[DELETE_BOOKING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}