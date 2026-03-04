import { db } from "@/lib/db"

/**
 * Calcula el precio de una reserva basado en CourtPricing.
 * Obtiene todas las bandas horarias del dia y calcula el precio proporcional
 * por horas, soportando reservas que cruzan multiples franjas.
 * CourtPricing.price se interpreta como precio por hora.
 * Si no hay reglas configuradas, devuelve 0 (gratis / sin precio definido).
 */
export async function calcularPrecioReserva(
  courtId: string,
  clubId: string,
  startTime: Date,
  endTime: Date
): Promise<number> {
  const dayOfWeek = startTime.getDay() // 0=Domingo, 6=Sabado
  const startDecimal = startTime.getHours() + startTime.getMinutes() / 60
  const endDecimal = endTime.getHours() + endTime.getMinutes() / 60

  // Obtener todas las bandas de precio del dia para esta pista
  const bandas = await db.courtPricing.findMany({
    where: { courtId, clubId, dayOfWeek },
    select: { startHour: true, endHour: true, price: true },
  })

  if (bandas.length === 0) return 0

  // Calcular precio proporcional por horas en cada banda que solapa
  let total = 0
  for (const banda of bandas) {
    const inicioSolape = Math.max(banda.startHour, startDecimal)
    const finSolape = Math.min(banda.endHour, endDecimal)
    const horas = finSolape - inicioSolape
    if (horas > 0) {
      total += horas * banda.price
    }
  }

  return Math.round(total * 100) / 100
}

/**
 * Obtiene todos los precios de una pista para un dia concreto.
 * Util para mostrar precios en la UI de reserva del jugador.
 */
export async function obtenerPreciosPista(
  courtId: string,
  clubId: string,
  dayOfWeek: number
): Promise<{ startHour: number; endHour: number; price: number }[]> {
  const pricings = await db.courtPricing.findMany({
    where: {
      courtId,
      clubId,
      dayOfWeek,
    },
    orderBy: { startHour: "asc" },
    select: {
      startHour: true,
      endHour: true,
      price: true,
    },
  })

  return pricings
}
