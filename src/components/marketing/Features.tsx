import {
  CalendarDays,
  Users,
  Trophy,
  CreditCard,
  Smartphone,
  BarChart3,
  Newspaper,
  Shield,
} from "lucide-react"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

const funcionalidades = [
  {
    icono: CalendarDays,
    titulo: "Reservas 24/7 sin WhatsApp",
    descripcion:
      "Tus socios reservan desde el móvil a cualquier hora. Detección de solapamientos y confirmación automática.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    icono: Users,
    titulo: "Socios organizados al fin",
    descripcion:
      "Perfiles completos, importación masiva desde Excel y comunicación directa. Adiós a las listas de papel.",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    icono: Trophy,
    titulo: "Ligas y torneos automáticos",
    descripcion:
      "Genera cuadros, registra resultados y publica clasificaciones. Todo calculado y visible para tus jugadores.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    icono: CreditCard,
    titulo: "Cobra online o en caja",
    descripcion:
      "Pagos con Stripe integrados o marca presencial. Tú decides cómo cobra cada pista en cada franja.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icono: Smartphone,
    titulo: "Portal móvil para jugadores",
    descripcion:
      "Reservas, partidas abiertas, competiciones y perfil. Sin descargar nada, funciona desde el navegador.",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    icono: BarChart3,
    titulo: "Analíticas que importan",
    descripcion:
      "Ocupación por pista, ingresos, tendencias y crecimiento de socios. Datos reales para decisiones reales.",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    icono: Newspaper,
    titulo: "Noticias y blog del club",
    descripcion:
      "Comunica novedades, eventos y promociones directamente a tus socios desde tu propio portal.",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    icono: Shield,
    titulo: "Roles y permisos seguros",
    descripcion:
      "Admins, staff y socios con accesos diferenciados. Cada persona ve solo lo que necesita.",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
]

export default function Features() {
  return (
    <section id="funcionalidades" className="border-t py-20 md:py-28">
      <div className="container">
        {/* Header */}
        <AnimateOnScroll animation="fade-up" className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Todo lo que tu club necesita.{" "}
            <span className="text-muted-foreground">Nada que no necesite.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            8 herramientas esenciales para la gestión diaria de tu club.
            Sin módulos innecesarios, sin complejidad de más.
          </p>
        </AnimateOnScroll>

        {/* Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
          {funcionalidades.map((feat, i) => (
            <AnimateOnScroll
              key={feat.titulo}
              animation="fade-up"
              delay={i * 60}
            >
              <div className="landing-card-hover group rounded-2xl border bg-card p-6 md:p-7">
                {/* Icono */}
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${feat.color.split(" ")[0]}`}
                >
                  <feat.icono
                    className={`h-5 w-5 ${feat.color.split(" ").slice(1).join(" ")}`}
                  />
                </div>

                {/* Texto */}
                <h3 className="mt-4 font-display text-base font-semibold">
                  {feat.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feat.descripcion}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
