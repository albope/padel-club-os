import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { validarBody } from "@/lib/validation"
import * as z from "zod"

const PricingRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0, "Dia debe ser 0-6.").max(6, "Dia debe ser 0-6."),
  startHour: z.number().int().min(0, "Hora inicio debe ser 0-23.").max(23, "Hora inicio debe ser 0-23."),
  endHour: z.number().int().min(1, "Hora fin debe ser 1-24.").max(24, "Hora fin debe ser 1-24."),
  price: z.number().min(0, "El precio no puede ser negativo."),
}).refine(
  (data) => data.startHour < data.endHour,
  { message: "La hora de inicio debe ser menor que la hora de fin.", path: ["startHour"] }
)

const CourtPricingSchema = z.object({
  rules: z.array(PricingRuleSchema),
})

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
    const body = await req.json()
    const result = validarBody(CourtPricingSchema, body)
    if (!result.success) return result.response
    const { rules } = result.data

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
