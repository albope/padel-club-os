import { db } from "@/lib/db"

/**
 * Calcula el precio de una reserva basado en CourtPricing.
 * Busca la regla de precio para la pista, dia de la semana y hora de inicio.
 * Si no hay regla configurada, devuelve 0 (gratis / sin precio definido).
 */
export async function calcularPrecioReserva(
  courtId: string,
  clubId: string,
  startTime: Date,
  endTime: Date
): Promise<number> {
  const dayOfWeek = startTime.getDay() // 0=Domingo, 6=Sabado
  const startHour = startTime.getHours()

  // Buscar precio configurado para esta pista, dia y hora
  const pricing = await db.courtPricing.findFirst({
    where: {
      courtId,
      clubId,
      dayOfWeek,
      startHour: { lte: startHour },
      endHour: { gt: startHour },
    },
  })

  if (!pricing) {
    return 0
  }

  return pricing.price
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
