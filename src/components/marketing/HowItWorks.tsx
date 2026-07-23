import { getTranslations } from "next-intl/server"

const pasoKeys = [
  { numero: "1", titleKey: "step1Title", descKey: "step1Desc" },
  { numero: "2", titleKey: "step2Title", descKey: "step2Desc" },
  { numero: "3", titleKey: "step3Title", descKey: "step3Desc" },
] as const

export default async function HowItWorks() {
  const t = await getTranslations("marketing.howItWorks")

  return (
    <section id="como-funciona" className="border-y border-border bg-secondary">
      <div className="container grid gap-11 py-20 md:py-24">
        <div className="grid justify-items-center gap-3 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {t("eyebrow")}
          </div>
          <h2 className="font-display text-3xl tracking-tight md:text-4xl" style={{ fontWeight: 750 }}>
            {t("title")}
          </h2>
          <p className="max-w-[560px] text-[15px] leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {pasoKeys.map((paso) => (
            <div
              key={paso.numero}
              className="grid content-start gap-3 rounded-[var(--radius-surface)] border border-border bg-surface-raised p-7"
            >
              <div
                className="grid h-7 w-10 place-items-center rounded-[7px] border-2 border-foreground font-display text-[15px] [font-variant-numeric:tabular-nums]"
                style={{ fontWeight: 800 }}
              >
                {paso.numero}
              </div>
              <h3 className="mt-1.5 font-display text-[19px] font-bold">{t(paso.titleKey)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(paso.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
