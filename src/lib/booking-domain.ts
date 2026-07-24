import { partesEnZonaClub } from "@/lib/timezone"

export class BookingDomainError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "INVALID_BOOKING",
  ) {
    super(message)
    this.name = "BookingDomainError"
  }
}

export interface BookingPolicy {
  timezone: string
  openingTime: string | null
  closingTime: string | null
  bookingDuration: number | null
  maxAdvanceBooking?: number | null
}

function minutos(hora: string | null, fallback: number): number {
  if (!hora || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)) return fallback
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

function mismaFechaLocal(a: Date, b: Date, timezone: string): boolean {
  const pa = partesEnZonaClub(a, timezone)
  const pb = partesEnZonaClub(b, timezone)
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day
}

export function validarRangoReserva(params: {
  startTime: Date
  endTime: Date
  policy: BookingPolicy
  now?: Date
  requireFuture?: boolean
  enforceDuration?: boolean
}): void {
  const {
    startTime,
    endTime,
    policy,
    now = new Date(),
    requireFuture = false,
    enforceDuration = true,
  } = params

  if (
    Number.isNaN(startTime.getTime())
    || Number.isNaN(endTime.getTime())
    || endTime <= startTime
  ) {
    throw new BookingDomainError("El rango de fecha y hora no es valido.")
  }
  if (requireFuture && startTime <= now) {
    throw new BookingDomainError("No puedes reservar en el pasado.")
  }
  if (!mismaFechaLocal(startTime, endTime, policy.timezone)) {
    throw new BookingDomainError("La reserva debe comenzar y terminar en el mismo dia del club.")
  }

  const inicio = partesEnZonaClub(startTime, policy.timezone)
  const fin = partesEnZonaClub(endTime, policy.timezone)
  const inicioMin = inicio.hour * 60 + inicio.minute
  const finMin = fin.hour * 60 + fin.minute
  const apertura = minutos(policy.openingTime, 0)
  const cierre = minutos(policy.closingTime, 24 * 60)

  if (inicioMin < apertura || finMin > cierre) {
    throw new BookingDomainError(
      `El horario debe estar entre ${policy.openingTime || "00:00"} y ${policy.closingTime || "23:59"}.`,
    )
  }

  const diferenciaMs = endTime.getTime() - startTime.getTime()
  if (
    startTime.getUTCSeconds() !== 0
    || endTime.getUTCSeconds() !== 0
    || startTime.getUTCMilliseconds() !== 0
    || endTime.getUTCMilliseconds() !== 0
    || diferenciaMs % 60_000 !== 0
  ) {
    throw new BookingDomainError("La reserva debe comenzar y terminar en minutos exactos.")
  }

  const duracion = diferenciaMs / 60_000
  if (enforceDuration && policy.bookingDuration && duracion !== policy.bookingDuration) {
    throw new BookingDomainError(
      `La reserva debe durar ${policy.bookingDuration} minutos.`,
    )
  }
  if (policy.maxAdvanceBooking && requireFuture) {
    const localNow = partesEnZonaClub(now, policy.timezone)
    const localStart = partesEnZonaClub(startTime, policy.timezone)
    const nowDay = Date.UTC(localNow.year, localNow.month - 1, localNow.day)
    const startDay = Date.UTC(localStart.year, localStart.month - 1, localStart.day)
    const dayDistance = Math.round((startDay - nowDay) / 86_400_000)
    if (dayDistance > policy.maxAdvanceBooking) {
      throw new BookingDomainError(
        `Solo puedes reservar con ${policy.maxAdvanceBooking} dias de antelacion.`,
      )
    }
  }
}

export function respuestaErrorReserva(error: unknown): {
  status: number
  code: string
  message: string
} | null {
  if (error instanceof BookingDomainError) {
    return { status: error.status, code: error.code, message: error.message }
  }

  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as {
      code?: unknown
      meta?: { constraint?: unknown }
    }
    const constraint = String(
      prismaError.meta?.constraint || "",
    )
    if (
      prismaError.code === "P2002"
      || prismaError.code === "P2004"
      || constraint.includes("Booking_no_active_overlap")
    ) {
      return {
        status: 409,
        code: "BOOKING_CONFLICT",
        message: "Ese horario acaba de ser reservado. Elige otro disponible.",
      }
    }
  }
  return null
}
