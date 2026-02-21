'use client'

import React from 'react'
import { Calendar, Users, Fence, TrendingUp } from 'lucide-react'
import StatsCards from './StatsCards'
import BookingTrends from './BookingTrends'
import MemberGrowth from './MemberGrowth'
import CourtUtilization from './CourtUtilization'
import PeakHours from './PeakHours'

const iconMap = {
  Calendar,
  Users,
  Fence,
  TrendingUp,
} as const

interface StatData {
  label: string
  value: string | number
  iconName: keyof typeof iconMap
  trend?: string
  trendUp?: boolean
}

interface AnaliticasClientProps {
  statsData: StatData[]
  bookingTrends: Array<{ fecha: string; reservas: number }>
  memberGrowth: Array<{ mes: string; socios: number }>
  courtUtilization: Array<{ pista: string; utilizacion: number }>
  peakHours: Array<{ dia: string; hora: number; reservas: number }>
}

export default function AnaliticasClient({
  statsData,
  bookingTrends,
  memberGrowth,
  courtUtilization,
  peakHours,
}: AnaliticasClientProps) {
  // Convertir iconName a componentes de icono
  const stats = statsData.map(s => ({
    label: s.label,
    value: s.value,
    icon: iconMap[s.iconName],
    trend: s.trend,
    trendUp: s.trendUp,
  }))

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BookingTrends data={bookingTrends} />
        <MemberGrowth data={memberGrowth} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CourtUtilization data={courtUtilization} />
        <PeakHours data={peakHours} />
      </div>
    </div>
  )
}
