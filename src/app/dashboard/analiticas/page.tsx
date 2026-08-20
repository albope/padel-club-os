import React from 'react'
import { getServerSession } from 'next-auth'
import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import AnaliticasClient from '@/components/analiticas/AnaliticasClient'
import {
  analyticsDayRange,
  analyticsMonthRanges,
  buildBookingTrends,
  buildMemberGrowth,
  calculateCourtUtilization,
} from '@/lib/analytics'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { diaSemanaEnZonaClub, partesEnZonaClub } from '@/lib/timezone'

function buildPeakHours(bookings: Array<{ startTime: Date }>, timezone: string) {
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const counts = new Map<string, number>()

  for (const booking of bookings) {
    const day = days[diaSemanaEnZonaClub(booking.startTime, timezone)]
    const hour = partesEnZonaClub(booking.startTime, timezone).hour
    const key = `${day}-${hour}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return Array.from(counts.entries()).map(([key, reservas]) => {
    const [dia, hour] = key.split('-')
    return { dia, hora: Number(hour), reservas }
  })
}

export default async function AnaliticasPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect('/dashboard')

  const clubId = session.user.clubId
  const locale = await getLocale()
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB'
  const now = new Date()

  const club = await db.club.findUnique({
    where: { id: clubId },
    select: {
      openingTime: true,
      closingTime: true,
      timezone: true,
      courts: { select: { id: true, name: true } },
    },
  })
  if (!club) redirect('/dashboard')

  const timezone = club.timezone
  const dayRange = analyticsDayRange(now, 30, timezone)
  const monthRanges = analyticsMonthRanges(now, timezone)

  const [bookings, blocks, memberships, totalBookings, currentMonth, previousMonth] =
    await Promise.all([
      db.booking.findMany({
        where: {
          clubId,
          cancelledAt: null,
          startTime: { lt: dayRange.end },
          endTime: { gt: dayRange.start },
        },
        select: { courtId: true, startTime: true, endTime: true },
        orderBy: { startTime: 'asc' },
      }),
      db.courtBlock.findMany({
        where: {
          clubId,
          startTime: { lt: dayRange.end },
          endTime: { gt: dayRange.start },
        },
        select: { courtId: true, startTime: true, endTime: true },
      }),
      db.clubMembership.findMany({
        where: { clubId, role: 'PLAYER', status: 'ACTIVE' },
        select: { joinedAt: true },
        orderBy: { joinedAt: 'asc' },
      }),
      db.booking.count({ where: { clubId, cancelledAt: null } }),
      db.booking.count({
        where: {
          clubId,
          cancelledAt: null,
          startTime: { gte: monthRanges.currentStart, lt: monthRanges.nextStart },
        },
      }),
      db.booking.count({
        where: {
          clubId,
          cancelledAt: null,
          startTime: { gte: monthRanges.previousStart, lt: monthRanges.currentStart },
        },
      }),
    ])

  const bookingTrends = buildBookingTrends(
    bookings.map((booking) => ({ start: booking.startTime })),
    now,
    localeCode,
    timezone,
  )
  const memberGrowth = buildMemberGrowth(
    memberships.map((membership) => membership.joinedAt),
    now,
    localeCode,
    timezone,
  )
  const courtUtilization = calculateCourtUtilization({
    courts: club.courts,
    bookings: bookings.map((booking) => ({
      courtId: booking.courtId,
      start: booking.startTime,
      end: booking.endTime,
    })),
    blocks: blocks.map((block) => ({
      courtId: block.courtId,
      start: block.startTime,
      end: block.endTime,
    })),
    rangeStart: dayRange.start,
    rangeEnd: dayRange.end,
    openingTime: club.openingTime,
    closingTime: club.closingTime,
    timezone,
  })
  const peakHours = buildPeakHours(bookings, timezone)
  const trend = previousMonth > 0
    ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
    : 0

  const statsData = [
    { label: 'Reservas totales', value: totalBookings, iconName: 'Calendar' as const },
    { label: 'Socios activos', value: memberships.length, iconName: 'Users' as const },
    { label: 'Pistas', value: club.courts.length, iconName: 'Fence' as const },
    {
      label: 'Reservas este mes',
      value: currentMonth,
      iconName: 'TrendingUp' as const,
      trend: trend !== 0 ? `${trend > 0 ? '+' : ''}${trend}%` : undefined,
      trendUp: trend > 0,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analiticas</h1>
        <p className="mt-1 text-muted-foreground">
          Datos reales de reservas, membresias activas y capacidad operativa.
        </p>
      </div>

      <AnaliticasClient
        statsData={statsData}
        bookingTrends={bookingTrends}
        memberGrowth={memberGrowth}
        courtUtilization={courtUtilization}
        peakHours={peakHours}
      />
    </div>
  )
}
