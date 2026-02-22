import Link from "next/link"
import { ArrowRight, MessageCircle, Table, Puzzle, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

const problemas = [
  {
    icono: MessageCircle,
    titulo: "Reservas por WhatsApp",
    antes: "Mensajes a todas horas, reservas duplicadas y socios que se olvidan de cancelar.",
    despues: "Tus socios reservan solos desde el móvil, 24/7, con confirmación automática.",
  },
  {
    icono: Table,
    titulo: "Competiciones en Excel",
    antes: "Cuadros manuales, resultados que no cuadran y horas perdidas cada semana.",
    despues: "Ligas y torneos automáticos: genera cuadros, registra resultados y publica clasificaciones.",
  },
  {
    icono: Puzzle,
    titulo: "Gestión fragmentada",
    antes: "Una app para pagos, otra para socios, un cuaderno para pistas. Todo desconectado.",
    despues: "Reservas, socios, pagos, competiciones y noticias en un solo lugar.",
  },
]

export default function PainPoints() {
  return (
    <section className="bg-muted/30 border-t py-20 md:py-28">
      <div className="container">
        {/* Header */}
        <AnimateOnScroll animation="fade-up" className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            ¿Suena familiar?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Si gestionas tu club con WhatsApp, Excel o papel, sabemos exactamente
            por lo que estás pasando.
          </p>
        </AnimateOnScroll>

        {/* Cards */}
        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-3 md:gap-8">
          {problemas.map((problema, i) => (
            <AnimateOnScroll
              key={problema.titulo}
              animation="fade-up"
              delay={i * 100}
            >
              <div className="landing-card-hover group overflow-hidden rounded-2xl border bg-card">
                {/* Header con icono */}
                <div className="border-b bg-muted/30 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <problema.icono className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold">
                      {problema.titulo}
                    </h3>
                  </div>
                </div>

                {/* Antes */}
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
                      <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                        Ahora
                      </span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {problema.antes}
                      </p>
                    </div>
                  </div>

                  {/* Separador gradiente */}
                  <div className="my-4 h-px bg-gradient-to-r from-red-200 via-muted to-emerald-200 dark:from-red-800 dark:via-muted dark:to-emerald-800" />

                  {/* Despues */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Con Padel Club OS
                      </span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {problema.despues}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* CTA */}
        <AnimateOnScroll animation="fade-up" className="mt-12 text-center">
          <Button size="lg" className="gap-2" asChild>
            <Link href="/register">
              Resuelve estos problemas hoy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
