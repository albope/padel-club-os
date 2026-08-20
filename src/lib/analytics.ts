import { instanteDesdeZonaClub, partesEnZonaClub, ZONA_CLUB } from './timezone'

const MS_MINUTE = 60_000

interface Interval {
  start: Date
  end: Date
}

export interface AnalyticsBooking extends Interval {
  courtId: string
}

export interface AnalyticsCourtBlock extends Interval {
  courtId: string | null
}

export interface AnalyticsCourt {
  id: string
  name: string
}

function parseTime(value: string | null | undefined, fallback: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value || fallback)
  if (!match) return parseTime(fallback, '09:00')
  return { hour: Number(match[1]), minute: Number(match[2]) }
}

function dateKey(date: Date, timezone: string) {
  const parts = partesEnZonaClub(date, timezone)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

function keyParts(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return { year, month, day }
}

function shiftDateKey(key: string, days: number, timezone: string) {
  const { year, month, day } = keyParts(key)
  return dateKey(instanteDesdeZonaClub(year, month, day + days, 12, 0, timezone), timezone)
}

export function analyticsDayRange(now: Date, days = 30, timezone = ZONA_CLUB) {
  const today = dateKey(now, timezone)
  const firstDay = shiftDateKey(today, -(days - 1), timezone)
  const keys = Array.from({ length: days }, (_, index) =>
    shiftDateKey(firstDay, index, timezone),
  )
  const first = keyParts(firstDay)
  const next = keyParts(shiftDateKey(today, 1, timezone))

  return {
    start: instanteDesdeZonaClub(first.year, first.month, first.day, 0, 0, timezone),
    end: instanteDesdeZonaClub(next.year, next.month, next.day, 0, 0, timezone),
    keys,
  }
}

export function analyticsMonthRanges(now: Date, timezone = ZONA_CLUB) {
  const current = partesEnZonaClub(now, timezone)
  return {
    currentStart: instanteDesdeZonaClub(current.year, current.month, 1, 0, 0, timezone),
    nextStart: instanteDesdeZonaClub(current.year, current.month + 1, 1, 0, 0, timezone),
    previousStart: instanteDesdeZonaClub(current.year, current.month - 1, 1, 0, 0, timezone),
  }
}

export function buildBookingTrends(
  bookings: Array<Pick<AnalyticsBooking, 'start'>>,
  now: Date,
  locale: string,
  timezone = ZONA_CLUB,
) {
  const range = analyticsDayRange(now, 30, timezone)
  const counts = new Map(range.keys.map((key) => [key, 0]))
  for (const booking of bookings) {
    const key = dateKey(booking.start, timezone)
    if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + 1)
  }

  return range.keys.map((key) => {
    const { year, month, day } = keyParts(key)
    const instant = instanteDesdeZonaClub(year, month, day, 12, 0, timezone)
    return {
      fecha: new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        timeZone: timezone,
      }).format(instant),
      reservas: counts.get(key) || 0,
    }
  })
}

export function buildMemberGrowth(
  joinedAt: Date[],
  now: Date,
  locale: string,
  timezone = ZONA_CLUB,
) {
  const current = partesEnZonaClub(now, timezone)

  return Array.from({ length: 12 }, (_, index) => {
    const offset = index - 11
    const monthStart = instanteDesdeZonaClub(
      current.year,
      current.month + offset,
      1,
      0,
      0,
      timezone,
    )
    const monthEnd = instanteDesdeZonaClub(
      current.year,
      current.month + offset + 1,
      1,
      0,
      0,
      timezone,
    )

    return {
      mes: new Intl.DateTimeFormat(locale, {
        month: 'short',
        year: '2-digit',
        timeZone: timezone,
      }).format(monthStart),
      socios: joinedAt.filter((date) => date <= now && date < monthEnd).length,
    }
  })
}

function intersect(a: Interval, b: Interval): Interval | null {
  const start = new Date(Math.max(a.start.getTime(), b.start.getTime()))
  const end = new Date(Math.min(a.end.getTime(), b.end.getTime()))
  return start < end ? { start, end } : null
}

function mergedDuration(intervals: Interval[]) {
  const sorted = intervals
    .filter((item) => item.start < item.end)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  if (!sorted.length) return 0

  let total = 0
  let start = sorted[0].start.getTime()
  let end = sorted[0].end.getTime()
  for (const interval of sorted.slice(1)) {
    const nextStart = interval.start.getTime()
    const nextEnd = interval.end.getTime()
    if (nextStart <= end) {
      end = Math.max(end, nextEnd)
    } else {
      total += end - start
      start = nextStart
      end = nextEnd
    }
  }
  return total + end - start
}

function openingIntervals(
  rangeStart: Date,
  rangeEnd: Date,
  openingTime: string | null | undefined,
  closingTime: string | null | undefined,
  timezone: string,
) {
  const opening = parseTime(openingTime, '09:00')
  const closing = parseTime(closingTime, '23:00')
  const result: Interval[] = []
  let key = dateKey(rangeStart, timezone)

  while (true) {
    const { year, month, day } = keyParts(key)
    const start = instanteDesdeZonaClub(
      year,
      month,
      day,
      opening.hour,
      opening.minute,
      timezone,
    )
    const closesNextDay =
      closing.hour < opening.hour
      || (closing.hour === opening.hour && closing.minute <= opening.minute)
    const end = instanteDesdeZonaClub(
      year,
      month,
      day + (closesNextDay ? 1 : 0),
      closing.hour,
      closing.minute,
      timezone,
    )
    const clipped = intersect({ start, end }, { start: rangeStart, end: rangeEnd })
    if (clipped) result.push(clipped)

    const nextKey = shiftDateKey(key, 1, timezone)
    const nextParts = keyParts(nextKey)
    const nextStart = instanteDesdeZonaClub(
      nextParts.year,
      nextParts.month,
      nextParts.day,
      0,
      0,
      timezone,
    )
    if (nextStart >= rangeEnd) break
    key = nextKey
  }
  return result
}

export function calculateCourtUtilization(input: {
  courts: AnalyticsCourt[]
  bookings: AnalyticsBooking[]
  blocks: AnalyticsCourtBlock[]
  rangeStart: Date
  rangeEnd: Date
  openingTime?: string | null
  closingTime?: string | null
  timezone?: string
}) {
  const timezone = input.timezone || ZONA_CLUB
  const openings = openingIntervals(
    input.rangeStart,
    input.rangeEnd,
    input.openingTime,
    input.closingTime,
    timezone,
  )
  const grossCapacity = mergedDuration(openings)

  return input.courts.map((court) => {
    const relevantBlocks = input.blocks.filter(
      (block) => block.courtId === null || block.courtId === court.id,
    )
    const blockedIntervals = openings.flatMap((opening) =>
      relevantBlocks
        .map((block) => intersect(opening, block))
        .filter((interval): interval is Interval => interval !== null),
    )
    const bookedIntervals = openings.flatMap((opening) =>
      input.bookings
        .filter((booking) => booking.courtId === court.id)
        .map((booking) => intersect(opening, booking))
        .filter((interval): interval is Interval => interval !== null),
    )
    const available = Math.max(0, grossCapacity - mergedDuration(blockedIntervals))
    const booked = mergedDuration(bookedIntervals)
    const utilization = available > 0
      ? Math.min(100, Math.round((booked / available) * 100))
      : 0

    return {
      pista: court.name,
      utilizacion: utilization,
      horasReservadas: Math.round((booked / MS_MINUTE / 60) * 10) / 10,
      horasDisponibles: Math.round((available / MS_MINUTE / 60) * 10) / 10,
    }
  })
}
