"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

const planes = [
  {
    nombre: "Starter",
    precioMensual: 19,
    precioAnual: 16,
    descripcion: "Para clubes pequeños que empiezan a digitalizarse.",
    features: [
      "Hasta 4 pistas",
      "Gestión de reservas",
      "Hasta 100 socios",
      "Portal de jugadores",
      "Soporte por email",
    ],
    destacado: false,
  },
  {
    nombre: "Pro",
    precioMensual: 49,
    precioAnual: 41,
    descripcion: "Para clubes en crecimiento que necesitan más.",
    features: [
      "Hasta 10 pistas",
      "Todo de Starter",
      "Competiciones y ligas",
      "Pagos con Stripe",
      "Analíticas avanzadas",
      "Soporte prioritario",
    ],
    destacado: true,
  },
  {
    nombre: "Enterprise",
    precioMensual: 99,
    precioAnual: 83,
    descripcion: "Para grandes clubes con necesidades avanzadas.",
    features: [
      "Pistas ilimitadas",
      "Todo de Pro",
      "Socios ilimitados",
      "Multi-sede",
      "API personalizada",
      "Onboarding dedicado",
    ],
    destacado: false,
  },
]

const comparativa = [
  {
    aspecto: "Reservas",
    tradicional: "WhatsApp / teléfono",
    nosotros: "24/7 online desde el móvil",
  },
  {
    aspecto: "Competiciones",
    tradicional: "Excel manual",
    nosotros: "Automáticas con clasificación",
  },
  {
    aspecto: "Pagos",
    tradicional: "Solo efectivo",
    nosotros: "Online + presencial",
  },
  {
    aspecto: "Precio",
    tradicional: "\"Llama para saber\"",
    nosotros: "Desde 19 EUR/mes",
  },
  {
    aspecto: "Configuración",
    tradicional: "Días o semanas",
    nosotros: "5 minutos",
  },
]

export default function Pricing() {
  const [anual, setAnual] = useState(false)

  return (
    <section id="precios" className="border-t py-20 md:py-28">
      <div className="container">
        {/* Header */}
        <AnimateOnScroll animation="fade-up" className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Precios claros. Sin sorpresas.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Mientras otros te hacen llamar a ventas para saber cuánto cuesta,
            nosotros te lo decimos aquí mismo.
          </p>
        </AnimateOnScroll>

        {/* Toggle mensual/anual */}
        <AnimateOnScroll animation="fade-up" delay={100} className="mt-8 flex items-center justify-center gap-3">
          <span className={cn("text-sm font-medium", !anual ? "text-foreground" : "text-muted-foreground")}>
            Mensual
          </span>
          <button
            onClick={() => setAnual(!anual)}
            className={cn(
              "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
              anual ? "bg-primary" : "bg-muted"
            )}
            role="switch"
            aria-checked={anual}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                anual ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
          <span className={cn("text-sm font-medium", anual ? "text-foreground" : "text-muted-foreground")}>
            Anual
          </span>
          {anual && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Ahorra 2 meses
            </Badge>
          )}
        </AnimateOnScroll>

        {/* Pricing cards */}
        <div className="mt-10 grid gap-6 md:mt-12 lg:grid-cols-3 lg:gap-8">
          {planes.map((plan, i) => (
            <AnimateOnScroll
              key={plan.nombre}
              animation="scale-in"
              delay={i * 100}
            >
              <div
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6 md:p-8",
                  plan.destacado
                    ? "border-primary bg-card shadow-xl shadow-primary/10 ring-1 ring-primary lg:scale-105"
                    : "bg-card"
                )}
              >
                {plan.destacado && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Más popular
                  </Badge>
                )}

                <h3 className="font-display text-xl font-semibold">{plan.nombre}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.descripcion}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {anual ? plan.precioAnual : plan.precioMensual}€
                  </span>
                  <span className="text-sm text-muted-foreground">/mes</span>
                </div>
                {anual && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Facturado anualmente ({plan.precioAnual * 12}€/año)
                  </p>
                )}
                <p className="mt-2 text-xs font-medium text-primary">
                  14 días gratis incluidos
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-8 gap-2"
                  variant={plan.destacado ? "default" : "outline"}
                  size="lg"
                  asChild
                >
                  <Link href="/register">
                    Empezar prueba gratuita
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Tabla comparativa */}
        <AnimateOnScroll animation="fade-up" delay={200} className="mx-auto mt-16 max-w-3xl md:mt-20">
          <h3 className="text-center font-display text-xl font-semibold md:text-2xl">
            Gestión tradicional vs Padel Club OS
          </h3>
          <div className="mt-8 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground md:px-6">Aspecto</th>
                  <th className="px-4 py-3 text-left font-medium text-red-600 dark:text-red-400 md:px-6">Tradicional</th>
                  <th className="px-4 py-3 text-left font-medium text-primary md:px-6">Padel Club OS</th>
                </tr>
              </thead>
              <tbody>
                {comparativa.map((row, i) => (
                  <tr key={row.aspecto} className={i < comparativa.length - 1 ? "border-b" : ""}>
                    <td className="px-4 py-3 font-medium md:px-6">{row.aspecto}</td>
                    <td className="px-4 py-3 text-muted-foreground md:px-6">
                      <span className="inline-flex items-center gap-1.5">
                        <X className="h-3.5 w-3.5 text-red-500" />
                        {row.tradicional}
                      </span>
                    </td>
                    <td className="px-4 py-3 md:px-6">
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        {row.nosotros}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
