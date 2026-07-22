// src/lib/timezone.ts - Utilidades de zona horaria de la plataforma.
//
// Los clubes operan en hora espanola (Europe/Madrid), pero el servidor puede
// correr en cualquier zona (Vercel = UTC, CI = UTC, dev local = CET/CEST).
// Un Booking.startTime es un instante (UTC); su "hora de pared" para el club
// debe calcularse SIEMPRE con estas utilidades, nunca con getHours()/getDay(),
// que dependen de la zona del proceso.

export const ZONA_CLUB = "Europe/Madrid"

const DTF_ZONA_CLUB = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_CLUB,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

export interface PartesFechaClub {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
  second: number
}

/** Componentes de fecha/hora de un instante, vistos desde la zona del club */
export function partesEnZonaClub(instante: Date): PartesFechaClub {
  const map: Record<string, number> = {}
  for (const p of DTF_ZONA_CLUB.formatToParts(instante)) {
    if (p.type !== "literal") map[p.type] = parseInt(p.value, 10)
  }
  if (map.hour === 24) map.hour = 0
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  }
}

/** Hora decimal (ej. 18.5 = 18:30) de un instante en la zona del club */
export function horaDecimalEnZonaClub(instante: Date): number {
  const p = partesEnZonaClub(instante)
  return p.hour + p.minute / 60
}

/** Dia de la semana (0=domingo ... 6=sabado) de un instante en la zona del club */
export function diaSemanaEnZonaClub(instante: Date): number {
  const p = partesEnZonaClub(instante)
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()
}

/**
 * Instante (Date UTC) cuya hora de pared en la zona del club es la indicada.
 * `month` es 1-12. Los componentes fuera de rango se normalizan (day 32 -> mes
 * siguiente), lo que permite aritmetica de dias sencilla.
 */
export function instanteDesdeZonaClub(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const p = partesEnZonaClub(new Date(guess))
  const mostradoComoUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  const offset = mostradoComoUTC - guess // diferencia zona club-UTC (1h CET / 2h CEST)
  return new Date(guess - offset)
}

/** Instante de las 00:00 en la zona del club para una fecha "YYYY-MM-DD" */
export function inicioDiaEnZonaClub(fechaISO: string): Date {
  const [year, month, day] = fechaISO.split("-").map((n) => parseInt(n, 10))
  return instanteDesdeZonaClub(year, month, day, 0, 0)
}
