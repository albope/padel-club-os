import { Clock, CreditCard, Smartphone, Zap } from "lucide-react"
import { getTranslations } from "next-intl/server"

const beneficioKeys = [
  { icono: Clock, titleKey: "item1Title", descKey: "item1Desc" },
  { icono: Smartphone, titleKey: "item2Title", descKey: "item2Desc" },
  { icono: CreditCard, titleKey: "item3Title", descKey: "item3Desc" },
  { icono: Zap, titleKey: "item4Title", descKey: "item4Desc" },
] as const

export default async function SocialProofBar() {
  const t = await getTranslations('marketing.socialProof')

  return (
    <section className="border-b border-t bg-background py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-10">
          {beneficioKeys.map((b) => (
            <div key={b.titleKey} className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <b.icono className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {t(b.titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(b.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
