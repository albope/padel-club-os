import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"

// GET: Obtener reglas de precio de una pista
export async function GET(
  req: Request,
  { params }: { params: { courtId: string } }
) {
  try {
    const auth = await requireAuth("court-pricing:read")
    if (isAuthError(auth)) return auth

    const { courtId } = params

    // Verificar que la pista pertenece al club
    const court = await db.court.findFirst({
      where: { id: courtId, clubId: auth.session.user.clubId },
    })

    if (!court) {
      return NextResponse.json(
        { error: "Pista no encontrada" },
        { status: 404 }
      )
    }

    const pricings = await db.courtPricing.findMany({
      where: { courtId, clubId: auth.session.user.clubId },
      orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
    })

    return NextResponse.json(pricings)
  } catch (error) {
    console.error("[COURT_PRICING_GET_ERROR]", error)
    return NextResponse.json(
      { error: "Error al obtener precios" },
      { status: 500 }
    )
  }
}

// POST: Crear/actualizar reglas de precio de una pista
export async function POST(
  req: Request,
  { params }: { params: { courtId: string } }
) {
  try {
    const auth = await requireAuth("court-pricing:update")
    if (isAuthError(auth)) return auth

    const { courtId } = params
    const { rules } = (await req.json()) as {
      rules: { dayOfWeek: number; startHour: number; endHour: number; price: number }[]
    }

    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { error: "Se requiere un array de reglas de precio" },
        { status: 400 }
      )
    }

    // Verificar que la pista pertenece al club
    const court = await db.court.findFirst({
      where: { id: courtId, clubId: auth.session.user.clubId },
    })

    if (!court) {
      return NextResponse.json(
        { error: "Pista no encontrada" },
        { status: 404 }
      )
    }

    // Validar reglas
    for (const rule of rules) {
      if (
        rule.dayOfWeek < 0 || rule.dayOfWeek > 6 ||
        rule.startHour < 0 || rule.startHour > 23 ||
        rule.endHour < 1 || rule.endHour > 24 ||
        rule.startHour >= rule.endHour ||
        rule.price < 0
      ) {
        return NextResponse.json(
          { error: "Datos de precio invalidos" },
          { status: 400 }
        )
      }
    }

    // Upsert masivo dentro de una transaccion
    await db.$transaction(async (prisma) => {
      // Eliminar reglas existentes de esta pista
      await prisma.courtPricing.deleteMany({
        where: { courtId, clubId: auth.session.user.clubId },
      })

      // Crear nuevas reglas
      if (rules.length > 0) {
        await prisma.courtPricing.createMany({
          data: rules.map((rule) => ({
            courtId,
            clubId: auth.session.user.clubId,
            dayOfWeek: rule.dayOfWeek,
            startHour: rule.startHour,
            endHour: rule.endHour,
            price: rule.price,
          })),
        })
      }
    })

    // Devolver reglas actualizadas
    const updated = await db.courtPricing.findMany({
      where: { courtId, clubId: auth.session.user.clubId },
      orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[COURT_PRICING_POST_ERROR]", error)
    return NextResponse.json(
      { error: "Error al guardar precios" },
      { status: 500 }
    )
  }
}
