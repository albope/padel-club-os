import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// API route to handle club settings

// PATCH function to update the club's settings
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, openingTime, closingTime } = body;

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedClub = await db.club.update({
      where: {
        id: session.user.clubId,
      },
      data: {
        name,
        openingTime,
        closingTime,
      },
    });

    return NextResponse.json(updatedClub);
  } catch (error) {
    console.error("[UPDATE_CLUB_SETTINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}