import { UserPlus, Settings, Rocket } from "lucide-react"
import { getTranslations } from "next-intl/server"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

const pasoKeys = [
  { numero: 1, icono: UserPlus, titleKey: "step1Title", descKey: "step1Desc" },
  { numero: 2, icono: Settings, titleKey: "step2Title", descKey: "step2Desc" },
  { numero: 3, icono: Rocket, titleKey: "step3Title", descKey: "step3Desc" },
] as const

export default async function HowItWorks() {
  const t = await getTranslations('marketing.howItWorks')

  return (
    <section id="como-funciona" className="border-t py-20 md:py-28">
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

        {/* Pasos */}
        <div className="relative mt-12 md:mt-16">
          {/* Linea conectora (desktop) */}
          <div className="absolute left-0 right-0 top-16 hidden h-px border-t-2 border-dashed border-primary/20 md:block" style={{ left: "16.67%", right: "16.67%" }} />

          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {pasoKeys.map((paso, i) => (
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
                    {t(paso.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(paso.descKey)}
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
