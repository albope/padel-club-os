"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

type PlanKey = "starter" | "pro" | "enterprise"

const planKeys: { key: PlanKey; destacado: boolean; featureCount: number }[] = [
  { key: "starter", destacado: false, featureCount: 5 },
  { key: "pro", destacado: true, featureCount: 6 },
  { key: "enterprise", destacado: false, featureCount: 6 },
]

const comparativaKeys = [
  { aspectKey: "bookings", tradKey: "bookingsTrad", usKey: "bookingsUs" },
  { aspectKey: "competitions", tradKey: "competitionsTrad", usKey: "competitionsUs" },
  { aspectKey: "payments", tradKey: "paymentsTrad", usKey: "paymentsUs" },
  { aspectKey: "price", tradKey: "priceTrad", usKey: "priceUs" },
  { aspectKey: "setup", tradKey: "setupTrad", usKey: "setupUs" },
] as const

export default function Pricing() {
  const [anual, setAnual] = useState(false)
  const t = useTranslations("marketing.pricing")

  return (
    <section id="precios" className="container grid gap-11 py-20 md:py-24">
      {/* Header */}
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

        {/* Toggle mensual/anual */}
        <div className="mt-2 flex items-center gap-3">
          <div
            className="inline-flex rounded-full border border-border bg-surface-raised p-[3px]"
            role="group"
            aria-label={t("billingToggle")}
          >
            <button
              type="button"
              onClick={() => setAnual(false)}
              aria-pressed={!anual}
              className={cn(
                "rounded-full px-[18px] py-1.5 text-[13px] transition-colors",
                !anual ? "bg-foreground font-bold text-background" : "font-semibold text-muted-foreground"
              )}
            >
              {t("monthly")}
            </button>
            <button
              type="button"
              onClick={() => setAnual(true)}
              aria-pressed={anual}
              className={cn(
                "rounded-full px-[18px] py-1.5 text-[13px] transition-colors",
                anual ? "bg-foreground font-bold text-background" : "font-semibold text-muted-foreground"
              )}
            >
              {t("annual")}
            </button>
          </div>
          {anual && (
            <span className="rounded-full border border-success-border bg-success-bg px-3 py-1 text-[11px] font-bold text-success-foreground">
              {t("saveMonths")}
            </span>
          )}
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        {planKeys.map((plan) => {
          const precioMensual = Number(t(`${plan.key}.price`))
          const precioAnual = Number(t(`${plan.key}.priceAnnual`))
          const features = Array.from({ length: plan.featureCount }, (_, j) =>
            t(`${plan.key}.feature${j + 1}`)
          )
          const destacado = plan.destacado

          return (
            <div
              key={plan.key}
              className={cn(
                "relative grid content-start gap-[18px] rounded-[var(--radius-surface)] border p-8",
                destacado
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface-raised text-foreground"
              )}
            >
              {destacado && (
                <span className="absolute -top-[11px] left-8 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
                  {t("popular")}
                </span>
              )}

              <div className="grid gap-1">
                <h3 className="font-display text-xl" style={{ fontWeight: 750 }}>
                  {t(`${plan.key}.name`)}
                </h3>
                <p className={cn("text-[13px]", destacado ? "text-sidebar-foreground" : "text-muted-foreground")}>
                  {t(`${plan.key}.desc`)}
                </p>
              </div>

              <div className="grid gap-1 [font-variant-numeric:tabular-nums]">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[42px] tracking-tight" style={{ fontWeight: 800 }}>
                    {anual ? precioAnual : precioMensual}&euro;
                  </span>
                  <span className={cn("text-[13px]", destacado ? "text-sidebar-foreground" : "text-muted-foreground")}>
                    {t("perMonth")}
                  </span>
                </div>
                {anual ? (
                  <span className={cn("text-xs", destacado ? "text-sidebar-foreground" : "text-muted-foreground")}>
                    {t("billedAnnually", { amount: precioAnual * 12 })}
                  </span>
                ) : (
                  <span className={cn("text-xs", destacado ? "text-sidebar-foreground" : "text-muted-foreground")}>
                    {t("trialIncluded")} &middot; {t("taxesExcluded")}
                  </span>
                )}
              </div>

              <div className="grid gap-2.5">
                {features.map((feature) => (
                  <div key={feature} className="flex items-baseline gap-2.5 text-[13.5px] leading-snug">
                    <span
                      className={cn(
                        "relative top-px h-2.5 w-3.5 flex-shrink-0 rounded-[3px] border-[1.5px]",
                        destacado ? "border-sidebar-primary bg-sidebar-primary/25" : "border-primary bg-primary/15"
                      )}
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/demo?source=pricing"
                className={cn(
                  "mt-1.5 block rounded-[var(--radius-control)] py-3 text-center text-sm font-bold transition-colors",
                  destacado
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : "bg-secondary text-foreground hover:bg-border"
                )}
              >
                {t("startTrial")}
              </Link>
            </div>
          )
        })}
      </div>

      {/* Tabla comparativa */}
      <div className="overflow-hidden rounded-[var(--radius-surface)] border border-border bg-surface-raised">
        <div className="border-b border-border px-7 py-5">
          <h3 className="font-display text-[19px]" style={{ fontWeight: 750 }}>
            {t("comparison.title")}
          </h3>
        </div>
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-border bg-background text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/80">
              <th scope="col" className="px-7 py-3 font-bold">{t("comparison.aspect")}</th>
              <th scope="col" className="px-7 py-3 font-bold">{t("comparison.traditional")}</th>
              <th scope="col" className="px-7 py-3 font-bold">{t("comparison.us")}</th>
            </tr>
          </thead>
          <tbody>
            {comparativaKeys.map((row, i) => (
              <tr key={row.aspectKey} className={i < comparativaKeys.length - 1 ? "border-b border-secondary" : ""}>
                <td className="px-7 py-3.5 font-bold">{t(`comparison.${row.aspectKey}`)}</td>
                <td className="px-7 py-3.5 text-muted-foreground">{t(`comparison.${row.tradKey}`)}</td>
                <td className="px-7 py-3.5 font-semibold text-primary">{t(`comparison.${row.usKey}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
