import Link from "next/link"
import { getTranslations } from "next-intl/server"

const problemaKeys = [
  { titleKey: "item1Title", beforeKey: "item1Before", afterKey: "item1After" },
  { titleKey: "item2Title", beforeKey: "item2Before", afterKey: "item2After" },
  { titleKey: "item3Title", beforeKey: "item3Before", afterKey: "item3After" },
] as const

export default async function PainPoints() {
  const t = await getTranslations("marketing.painPoints")

  return (
    // Isla oscura: `.dark` + `.theme-marcador` interno activan la paleta oscura
    // Marcador (tinta / cream / verde-rojo suaves) sin colores crudos.
    <section className="dark">
      <div className="theme-marcador bg-background text-foreground">
        <div className="container grid gap-11 py-20 md:py-24">
          <div className="grid max-w-[640px] gap-3">
            <h2 className="font-display text-3xl tracking-tight md:text-4xl" style={{ fontWeight: 750 }}>
              {t("title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground md:text-[17px]">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {problemaKeys.map((problema) => (
              <div
                key={problema.titleKey}
                className="grid content-start overflow-hidden rounded-[var(--radius-surface)] border border-border bg-card"
              >
                <h3 className="px-6 pb-3.5 pt-5 font-display text-lg font-bold">
                  {t(problema.titleKey)}
                </h3>
                <div className="grid gap-2 px-6 pb-4">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-destructive">
                    {t("now")}
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                    {t(problema.beforeKey)}
                  </p>
                </div>
                <div className="grid gap-2 border-t border-border bg-surface-raised px-6 pb-5 pt-4">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary-hover">
                    {t("withUs")}
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-foreground">
                    {t(problema.afterKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <Link
              href="/register"
              className="inline-block rounded-[var(--radius-control)] bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
