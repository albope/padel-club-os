import { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  MonitorX,
  Lock,
  BarChart3,
  DollarSign,
  ChevronDown,
  CalendarCheck,
  Users,
  GraduationCap,
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SITE_URL } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.switch")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: `${t("metaTitle")} - Padel Club OS`,
      description: t("metaDescription"),
      url: "/cambiar-desde-matchpoint",
    },
    alternates: {
      canonical: "/cambiar-desde-matchpoint",
    },
  }
}

export default async function CambiarDesdeMatchpointPage() {
  const t = await getTranslations("pages.switch")

  const painPoints = [
    { icono: MonitorX, titulo: t("pain1Title"), desc: t("pain1Desc") },
    { icono: Lock, titulo: t("pain2Title"), desc: t("pain2Desc") },
    { icono: BarChart3, titulo: t("pain3Title"), desc: t("pain3Desc") },
    { icono: DollarSign, titulo: t("pain4Title"), desc: t("pain4Desc") },
  ]

  const pasos = [
    { icono: CalendarCheck, titulo: t("step1Title"), desc: t("step1Desc") },
    { icono: Users, titulo: t("step2Title"), desc: t("step2Desc") },
    { icono: GraduationCap, titulo: t("step3Title"), desc: t("step3Desc") },
  ]

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
  ]

  // FAQPage JSON-LD
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="container flex flex-col items-center gap-6 pb-16 pt-24 text-center md:pt-32">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("metaTitle")}
          </Link>

          <Badge variant="secondary" className="text-sm">
            {t("badge")}
          </Badge>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {t("subtitle")}
          </p>

          <Button size="lg" className="mt-4 gap-2" asChild>
            <Link href="/demo?source=switch-matchpoint">
              {t("ctaButton")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Pain points */}
      <section className="border-t py-24">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {t("painTitle")}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {painPoints.map((pain) => (
              <div key={pain.titulo} className="rounded-xl border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <pain.icono className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="mt-4 font-semibold">{pain.titulo}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{pain.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {t("howTitle")}
          </h2>
          <div className="mt-12 space-y-8">
            {pasos.map((paso, i) => (
              <div key={paso.titulo} className="flex gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <paso.icono className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{paso.titulo}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{paso.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t py-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {t("faqTitle")}
          </h2>
          <div className="mt-12 divide-y rounded-xl border bg-card">
            {faqs.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-left font-medium transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-16">
            <div className="absolute inset-0 -z-0 opacity-10">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white" />
              <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("ctaTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                {t("ctaDesc")}
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="mt-8 gap-2 text-base"
                asChild
              >
                <Link href="/demo?source=switch-matchpoint">
                  {t("ctaButton")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
