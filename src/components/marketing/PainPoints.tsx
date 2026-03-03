import Link from "next/link"
import { ArrowRight, MessageCircle, Table, Puzzle, X, Check } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

const problemaKeys = [
  { icono: MessageCircle, titleKey: "item1Title", beforeKey: "item1Before", afterKey: "item1After" },
  { icono: Table, titleKey: "item2Title", beforeKey: "item2Before", afterKey: "item2After" },
  { icono: Puzzle, titleKey: "item3Title", beforeKey: "item3Before", afterKey: "item3After" },
] as const

export default async function PainPoints() {
  const t = await getTranslations('marketing.painPoints')

  return (
    <section className="bg-muted/30 border-t py-20 md:py-28">
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

        {/* Cards */}
        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-3 md:gap-8">
          {problemaKeys.map((problema, i) => (
            <AnimateOnScroll
              key={problema.titleKey}
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
                      {t(problema.titleKey)}
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
                        {t('now')}
                      </span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(problema.beforeKey)}
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
                        {t('withUs')}
                      </span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(problema.afterKey)}
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
              {t('cta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
