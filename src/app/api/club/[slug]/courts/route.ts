import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

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

    return NextResponse.json(courts, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    });
  } catch (error) {
    logger.error("CLUB_COURTS", "Error al obtener pistas del club", { ruta: "/api/club/[slug]/courts" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
