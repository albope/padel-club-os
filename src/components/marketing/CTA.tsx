import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function CTA() {
  const t = await getTranslations("marketing.cta")

  return (
    <section className="mx-auto grid max-w-[820px] justify-items-center gap-5 px-8 py-20 text-center md:py-24">
      <h2 className="font-display text-3xl tracking-tight text-balance md:text-4xl" style={{ fontWeight: 750 }}>
        {t("title")}
      </h2>
      <p className="max-w-[600px] text-base leading-relaxed text-muted-foreground md:text-[17px]">
        {t("subtitle")}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/demo?source=cta"
          className="rounded-[var(--radius-control)] bg-primary px-8 py-3.5 text-[15px] font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          {t("primary")}
        </Link>
        <Link href="/contacto" className="text-sm font-semibold text-foreground hover:text-primary">
          {t("secondary")}
        </Link>
      </div>
      <p className="text-xs text-muted-foreground/70">{t("trustLine")}</p>
    </section>
  )
}
