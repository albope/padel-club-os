"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ArrowRight, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

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
  const t = useTranslations('marketing.pricing')

  return (
    <section id="precios" className="border-t py-20 md:py-28">
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

        {/* Toggle mensual/anual */}
        <AnimateOnScroll animation="fade-up" delay={100} className="mt-8 flex items-center justify-center gap-3">
          <span className={cn("text-sm font-medium", !anual ? "text-foreground" : "text-muted-foreground")}>
            {t('monthly')}
          </span>
          <button
            onClick={() => setAnual(!anual)}
            className={cn(
              "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
              anual ? "bg-primary" : "bg-muted"
            )}
            role="switch"
            aria-checked={anual}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                anual ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
          <span className={cn("text-sm font-medium", anual ? "text-foreground" : "text-muted-foreground")}>
            {t('annual')}
          </span>
          {anual && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              {t('saveMonths')}
            </Badge>
          )}
        </AnimateOnScroll>

        {/* Pricing cards */}
        <div className="mt-10 grid gap-6 md:mt-12 lg:grid-cols-3 lg:gap-8">
          {planKeys.map((plan, i) => {
            const precioMensual = Number(t(`${plan.key}.price`))
            const precioAnual = Number(t(`${plan.key}.priceAnnual`))
            const features = Array.from({ length: plan.featureCount }, (_, j) =>
              t(`${plan.key}.feature${j + 1}`)
            )

            return (
              <AnimateOnScroll
                key={plan.key}
                animation="scale-in"
                delay={i * 100}
              >
                <div
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-6 md:p-8",
                    plan.destacado
                      ? "border-primary bg-card shadow-xl shadow-primary/10 ring-1 ring-primary lg:scale-105"
                      : "bg-card"
                  )}
                >
                  {plan.destacado && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {t('popular')}
                    </Badge>
                  )}

                  <h3 className="font-display text-xl font-semibold">{t(`${plan.key}.name`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`${plan.key}.desc`)}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">
                      {anual ? precioAnual : precioMensual}&euro;
                    </span>
                    <span className="text-sm text-muted-foreground">{t('perMonth')}</span>
                  </div>
                  {anual && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('billedAnnually', { amount: precioAnual * 12 })}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-medium text-primary">
                    {t('trialIncluded')}
                  </p>

                  <ul className="mt-6 flex-1 space-y-3">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="mt-8 gap-2"
                    variant={plan.destacado ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link href="/demo?source=pricing">
                      {t('startTrial')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </AnimateOnScroll>
            )
          })}
        </div>

        {/* Tabla comparativa */}
        <AnimateOnScroll animation="fade-up" delay={200} className="mx-auto mt-16 max-w-3xl md:mt-20">
          <h3 className="text-center font-display text-xl font-semibold md:text-2xl">
            {t('comparison.title')}
          </h3>
          <div className="mt-8 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground md:px-6">{t('comparison.aspect')}</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-red-600 dark:text-red-400 md:px-6">{t('comparison.traditional')}</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-primary md:px-6">{t('comparison.us')}</th>
                </tr>
              </thead>
              <tbody>
                {comparativaKeys.map((row, i) => (
                  <tr key={row.aspectKey} className={i < comparativaKeys.length - 1 ? "border-b" : ""}>
                    <td className="px-4 py-3 font-medium md:px-6">{t(`comparison.${row.aspectKey}`)}</td>
                    <td className="px-4 py-3 text-muted-foreground md:px-6">
                      <span className="inline-flex items-center gap-1.5">
                        <X className="h-3.5 w-3.5 text-red-500" />
                        {t(`comparison.${row.tradKey}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 md:px-6">
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        {t(`comparison.${row.usKey}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
