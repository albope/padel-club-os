'use client'

import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CourtUtilizationData {
  pista: string
  utilizacion: number // porcentaje 0-100
}

interface CourtUtilizationProps {
  data: CourtUtilizationData[]
  title?: string
}

function getBarColor(value: number): string {
  if (value >= 70) return '#22c55e' // green-500
  if (value >= 40) return '#eab308' // yellow-500
  return '#ef4444' // red-500
}

export default function CourtUtilization({
  data,
  title = "Uso por Pista",
}: CourtUtilizationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="pista"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value) => [`${value}%`, 'Utilizacion']}
              />
              <Bar dataKey="utilizacion" radius={[0, 4, 4, 0]} name="Utilizacion">
                {data.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.utilizacion)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No hay datos disponibles
          </div>
        )}
      </CardContent>
    </Card>
  )
}
