import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// GET: Obtener datos del club
export async function GET() {
  try {
    const auth = await requireAuth("settings:read")
    if (isAuthError(auth)) return auth

    const club = await db.club.findUnique({
      where: { id: auth.session.user.clubId },
    });

    return NextResponse.json(club);
  } catch (error) {
    console.error("[GET_CLUB_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH: Actualizar configuracion del club
export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth("settings:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const {
      name, openingTime, closingTime,
      description, phone, email, primaryColor,
      maxAdvanceBooking, cancellationHours,
      enableOpenMatches, enablePlayerBooking,
      bookingPaymentMode,
    } = body;

    const updatedClub = await db.club.update({
      where: { id: auth.session.user.clubId },
      data: {
        name, openingTime, closingTime,
        description, phone, email, primaryColor,
        maxAdvanceBooking, cancellationHours,
        enableOpenMatches, enablePlayerBooking,
        bookingPaymentMode,
      },
    });

    return NextResponse.json(updatedClub);
  } catch (error) {
    console.error("[UPDATE_CLUB_SETTINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
