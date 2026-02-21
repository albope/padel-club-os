import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: Obtener precios de una pista para un dia concreto (API publica)
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const courtId = searchParams.get("courtId")
    const date = searchParams.get("date") // formato: YYYY-MM-DD

    if (!courtId) {
      return NextResponse.json(
        { error: "Se requiere courtId" },
        { status: 400 }
      )
    }

    const club = await db.club.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    })

    if (!club) {
      return NextResponse.json(
        { error: "Club no encontrado" },
        { status: 404 }
      )
    }

    // Determinar dia de la semana
    let dayOfWeek: number | undefined
    if (date) {
      dayOfWeek = new Date(date).getDay()
    }

    const where: Record<string, unknown> = {
      courtId,
      clubId: club.id,
    }
    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek
    }

    const pricings = await db.courtPricing.findMany({
      where,
      orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
      select: {
        dayOfWeek: true,
        startHour: true,
        endHour: true,
        price: true,
      },
    })

    return NextResponse.json(pricings)
  } catch (error) {
    console.error("[GET_CLUB_PRICING_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
