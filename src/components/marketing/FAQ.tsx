import { ChevronDown } from "lucide-react"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

const preguntas = [
  {
    pregunta: "¿Cuánto tarda configurar mi club?",
    respuesta:
      "Menos de 5 minutos. Creas tu cuenta, añades tus pistas y ya puedes empezar a gestionar reservas y socios.",
  },
  {
    pregunta: "¿Necesito conocimientos técnicos?",
    respuesta:
      "No. Si sabes usar WhatsApp, sabes usar Padel Club OS. La plataforma está diseñada para ser intuitiva desde el primer momento.",
  },
  {
    pregunta: "¿Mis jugadores necesitan descargar una app?",
    respuesta:
      "No. El portal funciona directamente desde el navegador del móvil. Sin descargas, sin actualizaciones. Solo comparte el link de tu club.",
  },
  {
    pregunta: "¿Puedo migrar mis datos actuales?",
    respuesta:
      "Sí. Puedes importar tu lista de socios desde un archivo Excel en un solo clic. Si necesitas ayuda, te asistimos sin coste adicional.",
  },
  {
    pregunta: "¿Hay permanencia o compromiso mínimo?",
    respuesta:
      "No. Todos los planes son mensuales. Puedes cancelar cuando quieras sin penalizaciones ni preguntas incómodas.",
  },
  {
    pregunta: "¿Qué pasa cuando termina la prueba gratuita?",
    respuesta:
      "Eliges un plan que se adapte a tu club o tu cuenta se pausa. No cobramos nada automáticamente y nunca lo haremos sin tu permiso.",
  },
]

export default function FAQ() {
  return (
    <section className="border-t bg-muted/30 py-20 md:py-28">
      <div className="container">
        <AnimateOnScroll animation="fade-up" className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Preguntas frecuentes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Todo lo que necesitas saber antes de empezar.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-up" delay={100} className="mx-auto mt-12 max-w-3xl">
          <div className="divide-y rounded-2xl border bg-card">
            {preguntas.map((item) => (
              <details
                key={item.pregunta}
                className="group"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left font-medium transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  {item.pregunta}
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {item.respuesta}
                </div>
              </details>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
