import { getTranslations } from "next-intl/server"

const preguntaKeys = [
  { qKey: "q1", aKey: "a1" },
  { qKey: "q2", aKey: "a2" },
  { qKey: "q3", aKey: "a3" },
  { qKey: "q4", aKey: "a4" },
  { qKey: "q5", aKey: "a5" },
  { qKey: "q6", aKey: "a6" },
] as const

export default async function FAQ() {
  const t = await getTranslations("marketing.faq")

  return (
    <section className="border-y border-border bg-secondary">
      <div className="container grid items-start gap-12 py-20 md:py-24 lg:grid-cols-[0.8fr_1.4fr] lg:gap-14">
        <div className="grid gap-3">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {t("eyebrow")}
          </div>
          <h2 className="font-display text-[28px] leading-tight tracking-tight md:text-[34px]" style={{ fontWeight: 750 }}>
            {t("title")}
          </h2>
          <p className="text-[15px] text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid gap-3.5">
          {preguntaKeys.map((item) => (
            <div
              key={item.qKey}
              className="grid gap-2 rounded-[var(--radius-module)] border border-border bg-surface-raised px-6 py-5"
            >
              <h3 className="font-display text-[15.5px] font-bold">{t(item.qKey)}</h3>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">{t(item.aKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
