import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET: Obtener datos publicos de un club por slug (sin auth)
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const club = await db.club.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        logoUrl: true,
        openingTime: true,
        closingTime: true,
        description: true,
        phone: true,
        email: true,
        primaryColor: true,
        bannerUrl: true,
        instagramUrl: true,
        facebookUrl: true,
        bookingDuration: true,
        maxAdvanceBooking: true,
        enableOpenMatches: true,
        enablePlayerBooking: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado." }, { status: 404 });
    }

    return NextResponse.json(club);
  } catch (error) {
    console.error("[GET_CLUB_BY_SLUG_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
