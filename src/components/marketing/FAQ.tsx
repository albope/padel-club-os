import { ChevronDown } from "lucide-react"
import { getTranslations } from "next-intl/server"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

const preguntaKeys = [
  { qKey: "q1", aKey: "a1" },
  { qKey: "q2", aKey: "a2" },
  { qKey: "q3", aKey: "a3" },
  { qKey: "q4", aKey: "a4" },
  { qKey: "q5", aKey: "a5" },
  { qKey: "q6", aKey: "a6" },
] as const

export default async function FAQ() {
  const t = await getTranslations('marketing.faq')

  return (
    <section className="border-t bg-muted/30 py-20 md:py-28">
      <div className="container">
        <AnimateOnScroll animation="fade-up" className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-up" delay={100} className="mx-auto mt-12 max-w-3xl">
          <div className="divide-y rounded-2xl border bg-card">
            {preguntaKeys.map((item) => (
              <details
                key={item.qKey}
                className="group"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left font-medium transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  {t(item.qKey)}
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {t(item.aKey)}
                </div>
              </details>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
