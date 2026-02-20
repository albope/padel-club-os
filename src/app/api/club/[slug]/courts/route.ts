import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET: Obtener pistas de un club por slug (para portal publico, requiere auth de jugador)
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const club = await db.club.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado." }, { status: 404 });
    }

    const courts = await db.court.findMany({
      where: { clubId: club.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(courts);
  } catch (error) {
    console.error("[GET_CLUB_COURTS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
