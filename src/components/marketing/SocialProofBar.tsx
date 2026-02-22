import { Clock, CreditCard, Smartphone, Zap } from "lucide-react"

const beneficios = [
  {
    icono: Clock,
    titulo: "Configura en 5 min",
    descripcion: "Crea tu club, añade pistas y empieza a recibir reservas hoy mismo",
  },
  {
    icono: Smartphone,
    titulo: "Todo desde el móvil",
    descripcion: "Tus jugadores reservan, pagan y se apuntan a partidas sin llamar",
  },
  {
    icono: CreditCard,
    titulo: "Cobros automáticos",
    descripcion: "Stripe integrado para que cobres online sin perseguir a nadie",
  },
  {
    icono: Zap,
    titulo: "Adiós al Excel",
    descripcion: "Reservas, socios, competiciones y pagos en un solo lugar",
  },
]

export default function SocialProofBar() {
  return (
    <section className="border-b border-t bg-background py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-10">
          {beneficios.map((b) => (
            <div key={b.titulo} className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <b.icono className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {b.titulo}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {b.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
