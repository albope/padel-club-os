import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Resplandor radial superior */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(217_91%_20%/0.6),transparent)]" />

      {/* Patron de puntos */}
      <div className="landing-dot-pattern absolute inset-0" />

      {/* Orbes flotantes decorativos */}
      <div
        className="landing-orb absolute -left-32 top-1/4 h-64 w-64 bg-blue-500/10"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="landing-orb absolute -right-20 top-1/3 h-48 w-48 bg-teal-500/8"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="landing-orb absolute bottom-1/4 left-1/3 h-32 w-32 bg-blue-400/6"
        style={{ animationDelay: "2s" }}
      />

      {/* Contenido */}
      <div className="container relative flex flex-col items-center gap-6 pb-16 pt-28 text-center md:gap-8 md:pb-20 md:pt-36 lg:pt-40">
        {/* Badge */}
        <div className="hero-badge-enter inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          Prueba gratuita 14 días — sin tarjeta
        </div>

        {/* Headline */}
        <h1 className="hero-text-1 max-w-4xl font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Tu club de pádel merece
        </h1>
        <span className="hero-text-2 landing-gradient-text max-w-4xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          algo mejor
        </span>

        {/* Subtitulo */}
        <p className="hero-text-3 max-w-2xl text-base text-slate-300 md:text-lg lg:text-xl">
          Reservas, socios, competiciones y pagos en una sola plataforma.
          Diseñada para clubes que quieren dejar atrás el WhatsApp, el Excel y
          el papel.
        </p>

        {/* CTAs */}
        <div className="hero-cta-enter flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            size="lg"
            className="landing-cta-pulse gap-2 bg-white text-base font-semibold text-slate-900 hover:bg-white/90"
            asChild
          >
            <Link href="/register">
              Empieza gratis 14 días
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="border border-white/20 text-base text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <a href="#como-funciona">Ver cómo funciona</a>
          </Button>
        </div>

        {/* Trust line */}
        <p className="hero-text-3 text-sm text-slate-400">
          Sin tarjeta de crédito · Sin permanencia · Configura en 5 minutos
        </p>

        {/* Dashboard mockup */}
        <div className="hero-mockup-enter relative mt-8 w-full max-w-5xl md:mt-12">
          {/* Sombra decorativa */}
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-blue-500/10 blur-3xl" />

          {/* Card glass-morphism */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-md" style={{ transform: "perspective(1200px) rotateX(2deg)" }}>
            <div className="rounded-xl bg-slate-900/80 p-4 md:p-8">
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="rounded-lg border border-white/5 bg-slate-800/60 p-3 md:p-4">
                  <div className="text-xs text-slate-400 md:text-sm">Reservas hoy</div>
                  <div className="mt-1 text-xl font-bold text-white md:text-2xl">24</div>
                  <div className="mt-1 text-xs text-emerald-400">+12% vs ayer</div>
                </div>
                <div className="rounded-lg border border-white/5 bg-slate-800/60 p-3 md:p-4">
                  <div className="text-xs text-slate-400 md:text-sm">Socios activos</div>
                  <div className="mt-1 text-xl font-bold text-white md:text-2xl">342</div>
                  <div className="mt-1 text-xs text-emerald-400">+8 esta semana</div>
                </div>
                <div className="rounded-lg border border-white/5 bg-slate-800/60 p-3 md:p-4">
                  <div className="text-xs text-slate-400 md:text-sm">Ocupación</div>
                  <div className="mt-1 text-xl font-bold text-white md:text-2xl">87%</div>
                  <div className="mt-1 text-xs text-emerald-400">Máximo histórico</div>
                </div>
              </div>

              {/* Barras de pistas */}
              <div className="mt-3 grid grid-cols-2 gap-3 md:mt-4 md:grid-cols-4">
                {["Pista 1", "Pista 2", "Pista 3", "Pista 4"].map((pista) => (
                  <div key={pista} className="rounded-lg border border-white/5 bg-slate-800/40 p-3">
                    <div className="text-xs font-medium text-slate-300">{pista}</div>
                    <div className="mt-2 space-y-1.5">
                      <div className="h-2 rounded-full bg-blue-500/30" />
                      <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-blue-500 to-teal-400" />
                      <div className="h-2 w-1/2 rounded-full bg-blue-500/30" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
