import { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Phone,
  Clock,
  MessageCircle,
  MapPin,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ContactForm from "@/components/marketing/ContactForm"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.contact')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: `${t('metaTitle')} - Padel Club OS`,
      description: t('metaDescription'),
      url: "/contacto",
    },
    alternates: {
      canonical: "/contacto",
    },
  }
}

export default async function ContactoPage() {
  const t = await getTranslations('pages.contact')

  const infoContacto = [
    {
      icono: Mail,
      titulo: t('emailLabel'),
      detalle: t('emailValue'),
      href: `mailto:${t('emailValue')}`,
    },
    {
      icono: Phone,
      titulo: t('phoneLabel'),
      detalle: t('phoneValue'),
      href: `tel:+34912345678`,
    },
    {
      icono: Clock,
      titulo: t('responseLabel'),
      detalle: t('responseValue'),
    },
    {
      icono: MessageCircle,
      titulo: t('socialLabel'),
      detalle: t('socialValue'),
    },
  ]

  const preguntasFrecuentes = [
    { pregunta: t('faq1Q'), respuesta: t('faq1A') },
    { pregunta: t('faq2Q'), respuesta: t('faq2A') },
    { pregunta: t('faq3Q'), respuesta: t('faq3A') },
    { pregunta: t('faq4Q'), respuesta: t('faq4A') },
    { pregunta: t('faq5Q'), respuesta: t('faq5A') },
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
            {t('backHome')}
          </Link>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Formulario + Info */}
      <section className="py-24">
        <div className="container mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Formulario */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>

            {/* Info de contacto */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              {infoContacto.map((info) => (
                <div
                  key={info.titulo}
                  className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <info.icono className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{info.titulo}</h3>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="mt-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          {info.detalle}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {info.detalle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('faqTitle')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('faqSubtitle')}
            </p>
          </div>

          <div className="mt-12 divide-y rounded-xl border bg-card">
            {preguntasFrecuentes.map((faq) => (
              <details key={faq.pregunta} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-left font-medium transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  {faq.pregunta}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.respuesta}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Ubicacion */}
      <section className="py-24">
        <div className="container mx-auto max-w-3xl text-center">
          <MapPin className="mx-auto h-10 w-10 text-primary/60" />
          <h3 className="mt-4 text-xl font-semibold">{t('basedIn')}</h3>
          <p className="mt-2 text-muted-foreground">
            {t('basedInDesc')}
          </p>
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
                {t('seeInAction')}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                {t('seeInActionDesc')}
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
