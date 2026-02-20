import {
  CalendarDays,
  Users,
  Trophy,
  CreditCard,
  Smartphone,
  BarChart3,
} from "lucide-react"

const funcionalidades = [
  {
    icono: CalendarDays,
    titulo: "Reservas inteligentes",
    descripcion:
      "Gestion de pistas con deteccion de solapamientos, precios por franja horaria y reservas recurrentes.",
  },
  {
    icono: Users,
    titulo: "Gestion de socios",
    descripcion:
      "Altas, importacion masiva, perfiles detallados y comunicacion directa con tus jugadores.",
  },
  {
    icono: Trophy,
    titulo: "Competiciones",
    descripcion:
      "Ligas, torneos y eliminatorias. Genera cuadros, registra resultados y publica clasificaciones.",
  },
  {
    icono: CreditCard,
    titulo: "Pagos integrados",
    descripcion:
      "Cobra reservas online con Stripe o marca pagos presenciales. Facturacion automatica.",
  },
  {
    icono: Smartphone,
    titulo: "Portal para jugadores",
    descripcion:
      "Tus socios reservan, se unen a partidas abiertas y consultan rankings desde el movil.",
  },
  {
    icono: BarChart3,
    titulo: "Analiticas en tiempo real",
    descripcion:
      "Ocupacion por pista, ingresos, crecimiento de socios y tendencias de reservas.",
  },
]

export default function Features() {
  return (
    <section id="funcionalidades" className="border-t bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Todo lo que necesita tu club
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Una plataforma completa para gestionar cada aspecto de tu club de padel.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {funcionalidades.map((feat) => (
            <div
              key={feat.titulo}
              className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feat.icono className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{feat.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feat.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
