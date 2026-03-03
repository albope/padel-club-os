import { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Eye,
  MapPin,
  Heart,
  Code,
  Smartphone,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.about')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: `${t('metaTitle')} - Padel Club OS`,
      description: t('metaDescription'),
      url: "/sobre-nosotros",
    },
    alternates: {
      canonical: "/sobre-nosotros",
    },
  }
}

const principioIconos = [Sparkles, Eye, MapPin, Heart]

const tecnologiaIconos = [Code, Smartphone, Zap]

export default async function SobreNosotrosPage() {
  const t = await getTranslations('pages.about')

  const principios = [
    { icono: principioIconos[0], titulo: t('principle1Title'), descripcion: t('principle1Desc') },
    { icono: principioIconos[1], titulo: t('principle2Title'), descripcion: t('principle2Desc') },
    { icono: principioIconos[2], titulo: t('principle3Title'), descripcion: t('principle3Desc') },
    { icono: principioIconos[3], titulo: t('principle4Title'), descripcion: t('principle4Desc') },
  ]

  const estadisticas = [
    { valor: t('stat1Value'), etiqueta: t('stat1Label') },
    { valor: t('stat2Value'), etiqueta: t('stat2Label') },
    { valor: t('stat3Value'), etiqueta: t('stat3Label') },
    { valor: t('stat4Value'), etiqueta: t('stat4Label') },
  ]

  const tecnologias = [
    { icono: tecnologiaIconos[0], nombre: t('tech1Name'), descripcion: t('tech1Desc') },
    { icono: tecnologiaIconos[1], nombre: t('tech2Name'), descripcion: t('tech2Desc') },
    { icono: tecnologiaIconos[2], nombre: t('tech3Name'), descripcion: t('tech3Desc') },
  ]

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="container flex flex-col items-center gap-6 pb-20 pt-24 text-center md:pt-32">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backHome')}
          </Link>

          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm font-medium">
            {t('badge')}
          </Badge>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t('title').replace(t('titleHighlight'), '')}{" "}
            <span className="text-primary">{t('titleHighlight')}</span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Mi historia */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('howItStarted')}
          </h2>

          <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>{t('storyP1')}</p>

            <div className="border-l-4 border-primary pl-6">
              <p className="font-medium text-foreground">
                &ldquo;{t('storyQuote')}&rdquo;
              </p>
            </div>

            <p>{t('storyP2')}</p>
          </div>
        </div>
      </section>

      {/* Quién soy */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
              <div className="shrink-0">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, hsl(217,91%,52%) 0%, hsl(197,85%,48%) 100%)" }}
                >
                  AB
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Alberto Bort
                </h2>
                <p className="mt-1 text-lg font-medium text-primary">
                  {t('role')}
                </p>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {t('bioDesc')}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {tecnologias.map((tech) => (
                    <div
                      key={tech.nombre}
                      className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
                    >
                      <tech.icono className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{tech.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principios */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('principles')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('principlesSubtitle')}
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
            {principios.map((principio) => (
              <div
                key={principio.titulo}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <principio.icono className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{principio.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {principio.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('designedToSimplify')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('designedToSimplifyDesc')}
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
            {estadisticas.map((stat) => (
              <div key={stat.etiqueta} className="text-center">
                <div className="text-4xl font-bold text-primary">{stat.valor}</div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.etiqueta}</div>
              </div>
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
                {t('joinChange')}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                {t('joinChangeDesc')}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 text-base"
                  asChild
                >
                  <Link href="/register">
                    {t('startNow')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/#precios">{t('seePricing')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
