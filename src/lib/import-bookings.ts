// Funciones puras para importacion de reservas
// Extraidas para facilitar testing sin mock de DB

import { normalizarNombre } from "./import-courts"
import type { ImportError } from "./import-courts"

export type { ImportError }

export interface ReservaImportada {
  pista: string
  fecha: string
  horaInicio: string
  horaFin: string
  email?: string
  nombreInvitado?: string
  estadoPago?: string
  numJugadores?: number
  precio?: number
  fila: number
}

export interface ReservaValidada {
  courtId: string
  courtName: string
  userId: string | null
  guestName: string | null
  startTime: Date
  endTime: Date
  totalPrice: number
  paymentStatus: string
  numPlayers: number
  fila: number
}

/** Parsea una fecha en formato YYYY-MM-DD o DD/MM/YYYY. Devuelve Date (solo fecha, sin hora) o null. */
export function parsearFecha(valor: string): Date | null {
  const trimmed = valor.trim()
  if (!trimmed) return null

  // Formato YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, anio, mes, dia] = isoMatch
    const date = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia))
    if (isNaN(date.getTime())) return null
    // Verificar que los componentes no desbordaron (ej: mes 13)
    if (date.getFullYear() !== parseInt(anio) || date.getMonth() !== parseInt(mes) - 1 || date.getDate() !== parseInt(dia)) return null
    return date
  }

  // Formato DD/MM/YYYY
  const esMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (esMatch) {
    const [, dia, mes, anio] = esMatch
    const date = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia))
    if (isNaN(date.getTime())) return null
    if (date.getFullYear() !== parseInt(anio) || date.getMonth() !== parseInt(mes) - 1 || date.getDate() !== parseInt(dia)) return null
    return date
  }

  return null
}

/** Parsea una hora en formato HH:MM. Devuelve { hour, minute } o null. */
export function parsearHora(valor: string): { hour: number; minute: number } | null {
  const trimmed = valor.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)

  if (hour < 0 || hour > 23) return null
  if (minute < 0 || minute > 59) return null

  return { hour, minute }
}

/** Combina una fecha base con una hora para crear un DateTime. */
export function construirDatetime(fecha: Date, hora: { hour: number; minute: number }): Date {
  const result = new Date(fecha)
  result.setHours(hora.hour, hora.minute, 0, 0)
  return result
}

/** Deduplicar reservas por pista+fecha+horaInicio dentro de un CSV. Primera ocurrencia gana. */
export function dedupReservasCSV(reservas: ReservaImportada[]): {
  unicas: ReservaImportada[]
  errors: ImportError[]
} {
  const vistos = new Map<string, number>() // key -> fila original
  const unicas: ReservaImportada[] = []
  const errors: ImportError[] = []

  for (const reserva of reservas) {
    const key = `${normalizarNombre(reserva.pista)}|${reserva.fecha.trim()}|${reserva.horaInicio.trim()}`
    const filaAnterior = vistos.get(key)
    if (filaAnterior !== undefined) {
      errors.push({
        fila: reserva.fila,
        campo: "pista+fecha+horaInicio",
        mensaje: `Reserva duplicada en CSV: misma pista "${reserva.pista}", fecha y hora (ya aparece en fila ${filaAnterior})`,
      })
    } else {
      vistos.set(key, reserva.fila)
      unicas.push(reserva)
    }
  }

  return { unicas, errors }
}

const ESTADO_PAGO_VALIDOS = ["pendiente", "pagado", "exento"]
const ESTADO_PAGO_MAP: Record<string, string> = {
  pendiente: "pending",
  pagado: "paid",
  exento: "exempt",
}

/** Mapea estado de pago del CSV (espanol) al valor de la DB (ingles) */
export function mapearEstadoPago(valor: string | undefined): string {
  if (!valor || !valor.trim()) return "exempt"
  const norm = valor.trim().toLowerCase()
  return ESTADO_PAGO_MAP[norm] || "exempt"
}

/** Valida que el estado de pago sea valido */
export function esEstadoPagoValido(valor: string): boolean {
  return ESTADO_PAGO_VALIDOS.includes(valor.trim().toLowerCase())
}
