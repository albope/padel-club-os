import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 py-24 md:py-32">
      {/* Resplandor radial */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(217_91%_20%/0.4),transparent)]" />

      {/* Patron de puntos */}
      <div className="landing-dot-pattern absolute inset-0" />

      {/* Orbes decorativos */}
      <div className="landing-orb absolute -left-20 top-1/4 h-48 w-48 bg-blue-500/8" />
      <div className="landing-orb absolute -right-16 bottom-1/4 h-56 w-56 bg-teal-500/6" style={{ animationDelay: "4s" }} />

      <div className="container relative">
        <AnimateOnScroll animation="fade-up" className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Tu club no puede esperar mas
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
            Cada dia sin digitalizar es un dia de reservas perdidas,
            socios frustrados y horas malgastadas.
            Empieza hoy. Es gratis durante 14 dias.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="landing-cta-pulse gap-2 bg-white text-base font-semibold text-slate-900 hover:bg-white/90"
              asChild
            >
              <Link href="/register">
                Crear mi club ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="border border-white/20 text-base text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/contacto">Hablar con el equipo</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            Sin tarjeta de credito · Configura en 5 minutos · Cancela cuando quieras
          </p>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
