"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Save, Euro } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingRule {
  dayOfWeek: number
  startHour: number
  endHour: number
  price: number
}

interface CourtPricingFormProps {
  courtId: string
  openingHour: number
  closingHour: number
  initialPricings: PricingRule[]
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
const DAY_NAMES_FULL = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]

export default function CourtPricingForm({
  courtId,
  openingHour,
  closingHour,
  initialPricings,
}: CourtPricingFormProps) {
  // Crear grid de precios: [dayOfWeek][hour] = price
  const initGrid = () => {
    const grid: Record<string, string> = {}
    for (let day = 0; day < 7; day++) {
      for (let hour = openingHour; hour < closingHour; hour++) {
        const key = `${day}-${hour}`
        const existing = initialPricings.find(
          (p) => p.dayOfWeek === day && p.startHour <= hour && p.endHour > hour
        )
        grid[key] = existing ? existing.price.toString() : ""
      }
    }
    return grid
  }

  const [prices, setPrices] = React.useState<Record<string, string>>(initGrid)
  const [defaultPrice, setDefaultPrice] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const hours = Array.from(
    { length: closingHour - openingHour },
    (_, i) => openingHour + i
  )

  const handlePriceChange = (key: string, value: string) => {
    // Solo permitir numeros y punto decimal
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return
    setPrices((prev) => ({ ...prev, [key]: value }))
  }

  const handleApplyDefault = () => {
    if (!defaultPrice || isNaN(parseFloat(defaultPrice))) {
      toast({ title: "Error", description: "Introduce un precio valido", variant: "destructive" })
      return
    }
    setPrices((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (!next[key]) {
          next[key] = defaultPrice
        }
      }
      return next
    })
    toast({ title: "Aplicado", description: "Precio por defecto aplicado a las celdas vacias", variant: "success" })
  }

  const handleApplyAll = () => {
    if (!defaultPrice || isNaN(parseFloat(defaultPrice))) {
      toast({ title: "Error", description: "Introduce un precio valido", variant: "destructive" })
      return
    }
    setPrices((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        next[key] = defaultPrice
      }
      return next
    })
    toast({ title: "Aplicado", description: "Precio aplicado a todas las celdas", variant: "success" })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Convertir grid a reglas
      const rules: PricingRule[] = []
      for (let day = 0; day < 7; day++) {
        for (let hour = openingHour; hour < closingHour; hour++) {
          const key = `${day}-${hour}`
          const value = prices[key]
          if (value && parseFloat(value) > 0) {
            rules.push({
              dayOfWeek: day,
              startHour: hour,
              endHour: hour + 1,
              price: parseFloat(value),
            })
          }
        }
      }

      const res = await fetch(`/api/courts/${courtId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast({ title: "Error", description: data.error, variant: "destructive" })
        return
      }

      toast({ title: "Guardado", description: "Precios actualizados correctamente", variant: "success" })
    } catch {
      toast({ title: "Error", description: "No se pudieron guardar los precios", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Precio por defecto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Precio rapido
          </CardTitle>
          <CardDescription>
            Aplica un precio a todas las franjas o solo a las que estan vacias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-[200px]">
              <Label htmlFor="defaultPrice">Precio (EUR)</Label>
              <Input
                id="defaultPrice"
                type="text"
                inputMode="decimal"
                placeholder="Ej: 12"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleApplyDefault}>
              Rellenar vacios
            </Button>
            <Button variant="outline" onClick={handleApplyAll}>
              Aplicar a todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de precios */}
      <Card>
        <CardHeader>
          <CardTitle>Precios por franja horaria</CardTitle>
          <CardDescription>
            Introduce el precio en EUR para cada franja. Deja vacio para gratis (0 EUR).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 font-medium text-muted-foreground sticky left-0 bg-card z-10">
                    Hora
                  </th>
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                    <th key={day} className="p-2 font-medium text-center min-w-[72px]">
                      <span className="hidden sm:inline">{DAY_NAMES_FULL[day]}</span>
                      <span className="sm:hidden">{DAY_NAMES[day]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour} className="border-t border-border/50">
                    <td className="p-2 font-mono text-muted-foreground sticky left-0 bg-card z-10 whitespace-nowrap">
                      {hour.toString().padStart(2, "0")}:00
                    </td>
                    {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                      const key = `${day}-${hour}`
                      return (
                        <td key={key} className="p-1">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="—"
                            value={prices[key] ?? ""}
                            onChange={(e) => handlePriceChange(key, e.target.value)}
                            className={cn(
                              "h-8 text-center text-xs w-full min-w-[60px]",
                              prices[key] && parseFloat(prices[key]) > 0 && "bg-primary/5 border-primary/20"
                            )}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Boton guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar precios"}
        </Button>
      </div>
    </div>
  )
}
