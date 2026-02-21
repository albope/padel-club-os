'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PeakHoursData {
  dia: string     // "Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"
  hora: number    // 9, 10, 11, ..., 22
  reservas: number
}

interface PeakHoursProps {
  data: PeakHoursData[]
  title?: string
}

const DIAS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const HORAS = Array.from({ length: 14 }, (_, i) => i + 9) // 9:00 - 22:00

function getIntensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-muted/30'
  const ratio = value / max
  if (ratio >= 0.8) return 'bg-primary/90 text-primary-foreground'
  if (ratio >= 0.6) return 'bg-primary/70 text-primary-foreground'
  if (ratio >= 0.4) return 'bg-primary/50'
  if (ratio >= 0.2) return 'bg-primary/30'
  return 'bg-primary/10'
}

export default function PeakHours({ data, title = "Horas Punta" }: PeakHoursProps) {
  const { dataMap, maxValue } = useMemo(() => {
    const map = new Map<string, number>()
    let max = 0

    for (const item of data) {
      const key = `${item.dia}-${item.hora}`
      map.set(key, item.reservas)
      if (item.reservas > max) max = item.reservas
    }

    return { dataMap: map, maxValue: max }
  }, [data])

  const getValue = (dia: string, hora: number) => {
    return dataMap.get(`${dia}-${hora}`) || 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Header con dias */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
              <div /> {/* Celda vacia esquina */}
              {DIAS.map(dia => (
                <div key={dia} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {dia}
                </div>
              ))}
            </div>

            {/* Filas de horas */}
            {HORAS.map(hora => (
              <div key={hora} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                <div className="text-xs text-muted-foreground flex items-center justify-end pr-2">
                  {hora}:00
                </div>
                {DIAS.map(dia => {
                  const value = getValue(dia, hora)
                  return (
                    <div
                      key={`${dia}-${hora}`}
                      className={cn(
                        'rounded-sm h-8 flex items-center justify-center text-xs font-medium transition-colors cursor-default',
                        getIntensityClass(value, maxValue)
                      )}
                      title={`${dia} ${hora}:00 - ${value} reservas`}
                    >
                      {value > 0 ? value : ''}
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Leyenda */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-xs text-muted-foreground">Menos</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-sm bg-muted/30" />
                <div className="w-4 h-4 rounded-sm bg-primary/10" />
                <div className="w-4 h-4 rounded-sm bg-primary/30" />
                <div className="w-4 h-4 rounded-sm bg-primary/50" />
                <div className="w-4 h-4 rounded-sm bg-primary/70" />
                <div className="w-4 h-4 rounded-sm bg-primary/90" />
              </div>
              <span className="text-xs text-muted-foreground">Mas</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
