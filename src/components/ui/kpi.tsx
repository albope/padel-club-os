import * as React from "react"
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * KPI «Marcador» (prototipo 3a / Brand Kit): etiqueta caption, valor display
 * Archivo 28px con cifras tabulares y tendencia con flecha + texto (nunca
 * solo color). Pensado para dashboard y analiticas (fases 4-5).
 */
interface KpiProps {
  etiqueta: string
  valor: string
  /** Texto de tendencia, p. ej. "+4" o "+12%" */
  tendencia?: string
  direccion?: "sube" | "baja" | "neutra"
  icono?: LucideIcon
  className?: string
}

const iconoTendencia = {
  sube: ArrowUpRight,
  baja: ArrowDownRight,
  neutra: Minus,
} as const

const colorTendencia = {
  sube: "text-success-foreground",
  baja: "text-error-foreground",
  neutra: "text-muted-foreground",
} as const

export function Kpi({
  etiqueta,
  valor,
  tendencia,
  direccion = "neutra",
  icono: Icono,
  className,
}: KpiProps) {
  const IconoTendencia = iconoTendencia[direccion]

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
        {Icono && (
          <Icono className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2.5">
        <span className="font-display text-[28px] font-bold leading-none tracking-tight tabular-nums">
          {valor}
        </span>
        {tendencia && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
              colorTendencia[direccion]
            )}
          >
            <IconoTendencia className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {tendencia}
          </span>
        )}
      </div>
    </div>
  )
}
