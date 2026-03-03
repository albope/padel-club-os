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
import { getTranslations } from "next-intl/server"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

const funcionalidadKeys = [
  { icono: CalendarDays, titleKey: "bookingsTitle", descKey: "bookingsDesc", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { icono: Users, titleKey: "membersTitle", descKey: "membersDesc", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { icono: Trophy, titleKey: "competitionsTitle", descKey: "competitionsDesc", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { icono: CreditCard, titleKey: "paymentsTitle", descKey: "paymentsDesc", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { icono: Smartphone, titleKey: "portalTitle", descKey: "portalDesc", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  { icono: BarChart3, titleKey: "analyticsTitle", descKey: "analyticsDesc", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  { icono: Newspaper, titleKey: "newsTitle", descKey: "newsDesc", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  { icono: Shield, titleKey: "rolesTitle", descKey: "rolesDesc", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
] as const

export default async function Features() {
  const t = await getTranslations('marketing.features')

  return (
    <section id="funcionalidades" className="border-t py-20 md:py-28">
      <div className="container">
        {/* Header */}
        <AnimateOnScroll animation="fade-up" className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </AnimateOnScroll>

        {/* Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
          {funcionalidadKeys.map((feat, i) => (
            <AnimateOnScroll
              key={feat.titleKey}
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
                  {t(feat.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(feat.descKey)}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
