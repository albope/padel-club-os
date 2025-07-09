import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// This API route now handles both GET and POST requests for bookings.

// GET function to fetch all bookings
export async function GET() {
  try {
    const bookings = await db.booking.findMany({
      // In the future, we can add logic to filter by date range, court, etc.
      // For now, we fetch all of them.
      include: {
        user: { // Include the user who made the booking
          select: {
            name: true,
          }
        },
        court: { // Include the court that was booked
          select: {
            name: true,
          }
        }
      }
    });

    return NextResponse.json(bookings, { status: 200 });

  } catch (error) {
    console.error("[GET_BOOKINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST function to create a new booking
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Security check: ensure the user is an authenticated admin
    if (!session?.user || !session.user.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { courtId, userId, startTime, endTime } = body;

    // Basic validation
    if (!courtId || !userId || !startTime || !endTime) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const newBooking = await db.booking.create({
      data: {
        courtId,
        userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalPrice: 20.0, // We'll use a fixed price for now
        status: "confirmed",
        // Associate the booking with the admin's club
        clubId: session.user.clubId, 
      },
    });

    return NextResponse.json(newBooking, { status: 201 });

  } catch (error) {
    console.error("[CREATE_BOOKING_ERROR]", error);
    // Prisma can throw specific errors, e.g., for overlapping bookings
    // We can add more specific error handling here later.
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}