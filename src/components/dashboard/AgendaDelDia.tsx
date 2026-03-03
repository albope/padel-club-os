'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TodayBooking {
  id: string
  startTime: string
  endTime: string
  status: string
  guestName: string | null
  court: { name: string }
  user: { name: string | null } | null
}

interface AgendaDelDiaProps {
  bookings: TodayBooking[]
  openingTime: string
  closingTime: string
}

const AgendaDelDia: React.FC<AgendaDelDiaProps> = ({ bookings, openingTime, closingTime }) => {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB'
  const openHour = parseInt(openingTime.split(':')[0])
  const closeHour = parseInt(closingTime.split(':')[0])
  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i)

  // Agrupar reservas por hora de inicio
  const bookingsByHour = new Map<number, TodayBooking[]>()
  bookings.forEach(booking => {
    const hour = new Date(booking.startTime).getHours()
    if (!bookingsByHour.has(hour)) bookingsByHour.set(hour, [])
    bookingsByHour.get(hour)!.push(booking)
  })

  const currentHour = new Date().getHours()

  const today = new Date()
  const fechaFormateada = today.toLocaleDateString(localeCode, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('agendaTitle')}
        </CardTitle>
        <p className="text-sm text-muted-foreground capitalize">{fechaFormateada}</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {hours.map((hour) => {
            const hourBookings = bookingsByHour.get(hour) || []
            const isPast = hour < currentHour
            const isCurrent = hour === currentHour

            return (
              <div key={hour} className="flex gap-4 min-h-[3.5rem]">
                {/* Etiqueta de hora */}
                <div className={`w-14 shrink-0 text-right pt-0.5 text-sm font-medium ${
                  isCurrent ? 'text-primary font-bold' : isPast ? 'text-muted-foreground/50' : 'text-muted-foreground'
                }`}>
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>

                {/* Linea de timeline */}
                <div className="relative flex flex-col items-center">
                  <div className={`h-3 w-3 rounded-full shrink-0 mt-1.5 ${
                    isCurrent ? 'bg-primary ring-2 ring-primary/30' :
                    hourBookings.length > 0 ? 'bg-primary/70' : 'bg-muted'
                  }`} />
                  <div className="w-px flex-1 bg-border" />
                </div>

                {/* Reservas */}
                <div className={`flex-1 pb-4 ${isPast ? 'opacity-50' : ''}`}>
                  {hourBookings.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {hourBookings.map(booking => {
                        const startTime = new Date(booking.startTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })
                        const endTime = new Date(booking.endTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })
                        const displayName = booking.user?.name || booking.guestName || t('guest')
                        const isOpenMatch = booking.status === 'provisional'

                        return (
                          <div
                            key={booking.id}
                            className={`rounded-lg px-3 py-1.5 text-xs ${
                              isOpenMatch
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            <div className="font-semibold">{booking.court.name}</div>
                            <div>{isOpenMatch ? t('openMatch') : displayName}</div>
                            <div className="opacity-70">{startTime} - {endTime}</div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/40 pt-1">{t('noBookingsSlot')}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default AgendaDelDia
