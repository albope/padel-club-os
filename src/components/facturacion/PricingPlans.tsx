"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PricingPlansProps {
  currentTier: string
}

const plans = [
  {
    key: "starter",
    name: "Starter",
    price: 19,
    description: "Para clubes pequenos que empiezan a digitalizarse",
    features: [
      "Hasta 4 pistas",
      "Hasta 50 socios",
      "1 administrador",
      "Reservas basicas",
      "Portal del club",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 49,
    description: "Para clubes activos con competiciones y comunidad",
    popular: true,
    features: [
      "Pistas ilimitadas",
      "Hasta 500 socios",
      "3 administradores",
      "Competiciones y ligas",
      "Partidas abiertas",
      "Pagos online",
      "Analiticas avanzadas",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 99,
    description: "Para clubes grandes que necesitan control total",
    features: [
      "Todo ilimitado",
      "Administradores ilimitados",
      "White-label (tu marca)",
      "API de integracion",
      "Soporte prioritario",
      "Multi-deporte",
    ],
  },
]

export default function PricingPlans({ currentTier }: PricingPlansProps) {
  const [loading, setLoading] = React.useState<string | null>(null)

  const handleSelectPlan = async (planKey: string) => {
    if (planKey === currentTier) return

    setLoading(planKey)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" })
        return
      }

      window.location.href = data.url
    } catch {
      toast({ title: "Error", description: "No se pudo iniciar el proceso de pago", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Planes disponibles</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Elige el plan que mejor se adapte a las necesidades de tu club.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentTier
          return (
            <Card
              key={plan.key}
              className={cn(
                "relative flex flex-col",
                plan.popular && "border-primary shadow-md"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Mas popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}€</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={isCurrent || loading !== null}
                  onClick={() => handleSelectPlan(plan.key)}
                >
                  {isCurrent
                    ? "Plan actual"
                    : loading === plan.key
                      ? "Redirigiendo..."
                      : "Elegir plan"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
