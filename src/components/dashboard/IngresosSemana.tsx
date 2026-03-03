'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DatoIngresoDiario {
  fecha: string
  cobrado: number
  pendiente: number
}

interface IngresosSemanaProps {
  data: DatoIngresoDiario[]
}

export default function IngresosSemana({ data }: IngresosSemanaProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB'

  const formatearMoneda = (valor: number) =>
    new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor)

  const hayDatos = data.some(d => d.cobrado > 0 || d.pendiente > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('revenueChart')}</CardTitle>
      </CardHeader>
      <CardContent>
        {hayDatos ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="fecha"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(v) => formatearMoneda(v)}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value, name) => [
                  formatearMoneda(value as number),
                  name === 'cobrado' ? t('collected') : t('pending'),
                ]}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Legend
                formatter={(value: string) =>
                  value === 'cobrado' ? t('collected') : t('pending')
                }
              />
              <Bar
                dataKey="cobrado"
                stackId="ingresos"
                fill="#22c55e"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="pendiente"
                stackId="ingresos"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground">
            {t('noRevenueData')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
