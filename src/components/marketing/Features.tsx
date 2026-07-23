import { getTranslations } from "next-intl/server"

const funcionalidadKeys = [
  { n: "01", titleKey: "bookingsTitle", descKey: "bookingsDesc" },
  { n: "02", titleKey: "membersTitle", descKey: "membersDesc" },
  { n: "03", titleKey: "competitionsTitle", descKey: "competitionsDesc" },
  { n: "04", titleKey: "paymentsTitle", descKey: "paymentsDesc" },
  { n: "05", titleKey: "portalTitle", descKey: "portalDesc" },
  { n: "06", titleKey: "analyticsTitle", descKey: "analyticsDesc" },
  { n: "07", titleKey: "newsTitle", descKey: "newsDesc" },
  { n: "08", titleKey: "rolesTitle", descKey: "rolesDesc" },
] as const

export default async function Features() {
  const t = await getTranslations("marketing.features")

  return (
    <section id="funcionalidades" className="container py-20 md:py-24">
      <div className="mb-11 grid max-w-[680px] gap-3">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          {t("eyebrow")}
        </div>
        <h2 className="font-display text-3xl tracking-tight md:text-4xl" style={{ fontWeight: 750 }}>
          {t("title")}
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground md:text-[17px]">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {funcionalidadKeys.map((feat) => (
          <div
            key={feat.n}
            className="grid content-start gap-2.5 rounded-[var(--radius-module)] border border-border bg-surface-raised p-6"
          >
            <span className="font-mono text-[11px] text-primary">{feat.n}</span>
            <h3 className="font-display text-base font-bold leading-tight">{t(feat.titleKey)}</h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{t(feat.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
