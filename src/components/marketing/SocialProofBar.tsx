import { Building2, CalendarCheck, Users, Wifi } from "lucide-react"
import CounterNumber from "@/components/marketing/CounterNumber"

const stats = [
  {
    icono: Building2,
    valor: 50,
    sufijo: "+",
    etiqueta: "Clubes activos",
  },
  {
    icono: CalendarCheck,
    valor: 12000,
    sufijo: "+",
    etiqueta: "Reservas al mes",
  },
  {
    icono: Users,
    valor: 5000,
    sufijo: "+",
    etiqueta: "Jugadores registrados",
  },
  {
    icono: Wifi,
    valor: 99.9,
    sufijo: "%",
    etiqueta: "Disponibilidad",
  },
]

export default function SocialProofBar() {
  return (
    <section className="border-b border-t bg-background py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {stats.map((stat) => (
            <div key={stat.etiqueta} className="flex flex-col items-center gap-2 text-center">
              <stat.icono className="h-6 w-6 text-primary" />
              <div className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {stat.valor === 99.9 ? (
                  <span>99,9%</span>
                ) : (
                  <CounterNumber
                    target={stat.valor}
                    suffix={stat.sufijo}
                  />
                )}
              </div>
              <div className="text-sm text-muted-foreground">{stat.etiqueta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
