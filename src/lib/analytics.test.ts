import { describe, expect, it } from 'vitest'
import {
  analyticsDayRange,
  analyticsMonthRanges,
  buildBookingTrends,
  buildMemberGrowth,
  calculateCourtUtilization,
} from './analytics'

describe('analiticas fiables', () => {
  const now = new Date('2026-08-20T10:00:00Z')

  it('construye rangos de dia y mes en la zona del club', () => {
    const days = analyticsDayRange(now)
    expect(days.keys[0]).toBe('2026-07-22')
    expect(days.keys.at(-1)).toBe('2026-08-20')

    const months = analyticsMonthRanges(now)
    expect(months.currentStart.toISOString()).toBe('2026-07-31T22:00:00.000Z')
    expect(months.nextStart.toISOString()).toBe('2026-08-31T22:00:00.000Z')
  })

  it('muestra altas acumuladas reales de las membresias activas', () => {
    const data = buildMemberGrowth(
      [
        new Date('2025-01-15T10:00:00Z'),
        new Date('2026-07-10T10:00:00Z'),
        new Date('2026-08-05T10:00:00Z'),
      ],
      now,
      'es-ES',
    )

    expect(data.at(-2)?.socios).toBe(2)
    expect(data.at(-1)?.socios).toBe(3)
    expect(data.map((item) => item.socios)).not.toEqual(
      data.map((_, index) => Math.round((3 * (index + 1)) / 12)),
    )
  })

  it('agrupa reservas por el dia local y rellena los dias sin actividad', () => {
    const data = buildBookingTrends(
      [{ start: new Date('2026-08-19T22:30:00Z') }],
      now,
      'es-ES',
    )

    expect(data).toHaveLength(30)
    expect(data.at(-1)?.reservas).toBe(1)
    expect(data.filter((item) => item.reservas === 0)).toHaveLength(29)
  })

  it('calcula ocupacion con horas reales y descuenta bloqueos globales', () => {
    const result = calculateCourtUtilization({
      courts: [{ id: 'court-1', name: 'Pista Central' }],
      bookings: [{
        courtId: 'court-1',
        start: new Date('2026-08-20T07:00:00Z'),
        end: new Date('2026-08-20T08:00:00Z'),
      }],
      blocks: [{
        courtId: null,
        start: new Date('2026-08-20T08:30:00Z'),
        end: new Date('2026-08-20T09:00:00Z'),
      }],
      rangeStart: new Date('2026-08-19T22:00:00Z'),
      rangeEnd: new Date('2026-08-20T22:00:00Z'),
      openingTime: '09:00',
      closingTime: '11:00',
    })

    expect(result).toEqual([{
      pista: 'Pista Central',
      utilizacion: 67,
      horasReservadas: 1,
      horasDisponibles: 1.5,
    }])
  })
})
