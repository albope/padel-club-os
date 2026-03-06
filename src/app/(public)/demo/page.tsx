import { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarCheck,
  Users,
  TrendingUp,
  Shield,
  ExternalLink,
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import DemoLeadForm from "@/components/marketing/DemoLeadForm"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.demo")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: `${t("metaTitle")} - Padel Club OS`,
      description: t("metaDescription"),
      url: "/demo",
    },
    alternates: {
      canonical: "/demo",
    },
  }
}

export default async function DemoPage() {
  const t = await getTranslations("pages.demo")
  const demoBookingUrl = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL

  const beneficios = [
    { icono: CalendarCheck, titulo: t("benefit1Title"), desc: t("benefit1Desc") },
    { icono: Users, titulo: t("benefit2Title"), desc: t("benefit2Desc") },
    { icono: Shield, titulo: t("benefit3Title"), desc: t("benefit3Desc") },
    { icono: TrendingUp, titulo: t("benefit4Title"), desc: t("benefit4Desc") },
  ]

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="container flex flex-col items-center gap-6 pb-16 pt-24 text-center md:pt-32">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backHome")}
          </Link>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("trustLine")}
          </p>
        </div>
      </section>

      {/* Formulario + Beneficios */}
      <section className="py-24">
        <div className="container mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Formulario */}
            <div className="lg:col-span-3">
              <Suspense
                fallback={
                  <div className="h-[600px] animate-pulse rounded-xl border bg-muted/30" />
                }
              >
                <DemoLeadForm />
              </Suspense>

              {demoBookingUrl && (
                <div className="mt-6 text-center">
                  <p className="mb-3 text-sm text-muted-foreground">o</p>
                  <Button variant="outline" size="lg" className="gap-2" asChild>
                    <a href={demoBookingUrl} target="_blank" rel="noopener noreferrer">
                      {t("externalCalendarCTA")}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* Beneficios sidebar */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              {beneficios.map((b) => (
                <div
                  key={b.titulo}
                  className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <b.icono className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{b.titulo}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
