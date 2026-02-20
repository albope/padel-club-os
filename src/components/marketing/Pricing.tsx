import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const planes = [
  {
    nombre: "Starter",
    precio: 19,
    descripcion: "Para clubes pequenos que empiezan a digitalizarse.",
    destacado: false,
    funcionalidades: [
      "Hasta 4 pistas",
      "Hasta 50 socios",
      "1 administrador",
      "Reservas basicas",
      "Portal para jugadores",
      "Soporte por email",
    ],
  },
  {
    nombre: "Pro",
    precio: 49,
    descripcion: "Para clubes en crecimiento que quieren todo.",
    destacado: true,
    funcionalidades: [
      "Pistas ilimitadas",
      "Hasta 500 socios",
      "3 administradores",
      "Competiciones y ligas",
      "Partidas abiertas",
      "Pagos online (Stripe)",
      "Analiticas avanzadas",
      "Soporte prioritario",
    ],
  },
  {
    nombre: "Enterprise",
    precio: 99,
    descripcion: "Para grandes clubes y cadenas con necesidades avanzadas.",
    destacado: false,
    funcionalidades: [
      "Todo en Pro",
      "Socios ilimitados",
      "Administradores ilimitados",
      "API publica",
      "White-label (tu marca)",
      "Dominio personalizado",
      "Soporte dedicado",
      "Onboarding asistido",
    ],
  },
]

export default function Pricing() {
  return (
    <section id="precios" className="py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Precios transparentes, sin sorpresas
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Elige el plan que mejor se adapte a tu club. Sin permanencia, cancela cuando quieras.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {planes.map((plan) => (
            <div
              key={plan.nombre}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-8",
                plan.destacado && "border-primary shadow-lg ring-1 ring-primary"
              )}
            >
              {plan.destacado && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Mas popular
                </Badge>
              )}

              <div>
                <h3 className="text-xl font-semibold">{plan.nombre}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{plan.descripcion}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.precio}&euro;</span>
                <span className="text-muted-foreground">/mes</span>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.funcionalidades.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm">{feat}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full"
                variant={plan.destacado ? "default" : "outline"}
                asChild
              >
                <Link href="/register">Empezar con {plan.nombre}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
