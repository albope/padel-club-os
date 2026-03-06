import { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, ClipboardList, Phone, Monitor } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.demoThanks")
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  }
}

export default async function GraciasDemoPage() {
  const t = await getTranslations("pages.demoThanks")

  const pasos = [
    { icono: ClipboardList, titulo: t("step1"), desc: t("step1Desc") },
    { icono: Phone, titulo: t("step2"), desc: t("step2Desc") },
    { icono: Monitor, titulo: t("step3"), desc: t("step3Desc") },
  ]

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("subtitle")}
        </p>

        {/* Proximos pasos */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold">{t("nextStepsTitle")}</h2>
          <div className="mt-8 grid gap-6 text-left sm:grid-cols-3">
            {pasos.map((paso, i) => (
              <div key={paso.titulo} className="rounded-xl border bg-card p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <paso.icono className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{paso.titulo}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/">{t("backHome")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/blog">{t("seeBlog")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
