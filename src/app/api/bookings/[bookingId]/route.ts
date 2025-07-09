import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// API route to handle specific bookings by their ID

// PATCH function to update a booking
export async function PATCH(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { courtId, userId, startTime, endTime } = body;

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.bookingId) {
      return new NextResponse("Booking ID is required", { status: 400 });
    }

    const updatedBooking = await db.booking.update({
      where: {
        id: params.bookingId,
        clubId: session.user.clubId, // Security check
      },
      data: {
        courtId,
        userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
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

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.bookingId) {
      return new NextResponse("Booking ID is required", { status: 400 });
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