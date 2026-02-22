import { UserPlus, Settings, Rocket } from "lucide-react"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

const pasos = [
  {
    numero: 1,
    icono: UserPlus,
    titulo: "Crea tu cuenta",
    descripcion:
      "Regístrate en 30 segundos con tu email. Tu club se crea automáticamente con todo listo para empezar.",
  },
  {
    numero: 2,
    icono: Settings,
    titulo: "Configura tus pistas",
    descripcion:
      "Añade tus pistas, define horarios y precios. Importa tus socios desde Excel si ya los tienes.",
  },
  {
    numero: 3,
    icono: Rocket,
    titulo: "Empieza a gestionar",
    descripcion:
      "Comparte el link con tus socios. Ellos reservan desde el móvil; tú descansas.",
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t py-20 md:py-28">
      <div className="container">
        {/* Header */}
        <AnimateOnScroll animation="fade-up" className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Configura tu club en 5 minutos
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Sin instalaciones complicadas. Sin formación necesaria.
            Si sabes usar WhatsApp, sabes usar Padel Club OS.
          </p>
        </AnimateOnScroll>

        {/* Pasos */}
        <div className="relative mt-12 md:mt-16">
          {/* Linea conectora (desktop) */}
          <div className="absolute left-0 right-0 top-16 hidden h-px border-t-2 border-dashed border-primary/20 md:block" style={{ left: "16.67%", right: "16.67%" }} />

          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {pasos.map((paso, i) => (
              <AnimateOnScroll
                key={paso.numero}
                animation="fade-up"
                delay={i * 150}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Circulo numerado */}
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-xl font-bold text-white shadow-lg shadow-primary/25">
                    {paso.numero}
                  </div>

                  {/* Icono */}
                  <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <paso.icono className="h-6 w-6 text-primary" />
                  </div>

                  {/* Texto */}
                  <h3 className="mt-4 font-display text-lg font-semibold">
                    {paso.titulo}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {paso.descripcion}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
