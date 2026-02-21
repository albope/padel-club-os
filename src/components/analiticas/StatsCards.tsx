'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatItem {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string     // Ej: "+12%", "-3%"
  trendUp?: boolean  // true = positivo (verde), false = negativo (rojo)
}

interface StatsCardsProps {
  stats: StatItem[]
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-muted rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                {stat.trend && (
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      stat.trendUp
                        ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                        : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                    )}
                  >
                    {stat.trend}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
