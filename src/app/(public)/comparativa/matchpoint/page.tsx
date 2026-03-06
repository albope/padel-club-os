import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import AnimateOnScroll from "@/components/marketing/AnimateOnScroll"

const featureKeys = [
  "feat1", "feat2", "feat3", "feat4",
  "feat5", "feat6", "feat7", "feat8",
] as const

// Rows where Padel Club OS wins (green highlight)
const usWins = new Set(["feat1", "feat2", "feat3", "feat4", "feat5", "feat6", "feat7", "feat8"])

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.comparison")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: `${t("metaTitle")} - Padel Club OS`,
      description: t("metaDescription"),
      url: "/comparativa/matchpoint",
    },
    alternates: {
      canonical: "/comparativa/matchpoint",
    },
  }
}

export default async function ComparativaMatchpointPage() {
  const t = await getTranslations("pages.comparison")

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
            {t("metaTitle")}
          </Link>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Tabla comparativa */}
      <section className="py-24">
        <div className="container mx-auto max-w-4xl">
          <AnimateOnScroll animation="fade-up">
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th scope="col" className="px-4 py-4 text-left font-medium text-muted-foreground md:px-6">
                      {t("featureCol")}
                    </th>
                    <th scope="col" className="px-4 py-4 text-left font-medium text-red-600 dark:text-red-400 md:px-6">
                      {t("matchpointCol")}
                    </th>
                    <th scope="col" className="px-4 py-4 text-left font-medium text-primary md:px-6">
                      {t("usCol")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureKeys.map((key, i) => (
                    <tr
                      key={key}
                      className={i < featureKeys.length - 1 ? "border-b" : ""}
                    >
                      <td className="px-4 py-4 font-medium md:px-6">
                        {t(`${key}Name`)}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground md:px-6">
                        <span className="inline-flex items-center gap-1.5">
                          <X className="h-3.5 w-3.5 text-red-500" />
                          {t(`${key}Matchpoint`)}
                        </span>
                      </td>
                      <td className="px-4 py-4 md:px-6">
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-primary" />
                          {t(`${key}Us`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimateOnScroll>

          {/* Veredicto */}
          <AnimateOnScroll animation="fade-up" delay={100}>
            <div className="mt-12 text-center">
              <h2 className="text-2xl font-bold">{t("verdict")}</h2>
              <p className="mt-2 text-muted-foreground">{t("verdictDesc")}</p>
            </div>
          </AnimateOnScroll>
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
                <Link href="/demo?source=comparativa-matchpoint">
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
