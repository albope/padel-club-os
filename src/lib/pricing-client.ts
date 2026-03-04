/**
 * Utilidades de pricing para componentes client-side.
 * Replica la logica de calcularPrecioReserva() del servidor
 * para mostrar precios correctos sin llamadas API adicionales.
 */

export interface BandaPrecio {
  startHour: number
  endHour: number
  price: number
}

/**
 * Calcula el precio total de una reserva a partir de bandas horarias.
 * Soporta reservas que cruzan multiples franjas y horas parciales.
 * @param bandas - Array de bandas de precio para la pista/dia
 * @param horaInicio - Hora de inicio en formato "HH:MM"
 * @param duracionMinutos - Duracion de la reserva en minutos
 * @returns Precio total redondeado a 2 decimales, o null si no hay bandas
 */
export function calcularPrecioTotal(
  bandas: BandaPrecio[],
  horaInicio: string,
  duracionMinutos: number
): number | null {
  if (!bandas || bandas.length === 0) return null

  const [h, m] = horaInicio.split(":").map(Number)
  const startDecimal = h + m / 60
  const endDecimal = startDecimal + duracionMinutos / 60

  let total = 0
  let cubierto = false

  for (const banda of bandas) {
    const inicioSolape = Math.max(banda.startHour, startDecimal)
    const finSolape = Math.min(banda.endHour, endDecimal)
    const horas = finSolape - inicioSolape
    if (horas > 0) {
      total += horas * banda.price
      cubierto = true
    }
  }

  return cubierto ? Math.round(total * 100) / 100 : null
}
