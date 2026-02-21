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

export const metadata: Metadata = {
  title: "Contacto | Padel Club OS",
  description:
    "Contacta con el equipo de Padel Club OS. Estamos aqui para ayudarte a digitalizar tu club de padel.",
}

const infoContacto = [
  {
    icono: Mail,
    titulo: "Email",
    detalle: "contacto@padelclubos.com",
    href: "mailto:contacto@padelclubos.com",
  },
  {
    icono: Phone,
    titulo: "Telefono",
    detalle: "+34 912 345 678",
    href: "tel:+34912345678",
  },
  {
    icono: Clock,
    titulo: "Tiempo de respuesta",
    detalle: "Respondemos en menos de 24 horas",
  },
  {
    icono: MessageCircle,
    titulo: "Redes sociales",
    detalle: "@padelclubos en todas las plataformas",
  },
]

const preguntasFrecuentes = [
  {
    pregunta: "¿Cuanto tiempo tarda configurar mi club?",
    respuesta:
      "Menos de 5 minutos. Creas tu cuenta, anades tus pistas y ya puedes empezar a gestionar reservas. Si necesitas ayuda, nuestro equipo te acompana en el proceso.",
  },
  {
    pregunta: "¿Puedo migrar datos de mi sistema actual?",
    respuesta:
      "Si. Ofrecemos importacion masiva de socios y podemos ayudarte a migrar tu informacion existente sin coste adicional en los planes Pro y Enterprise.",
  },
  {
    pregunta: "¿Hay permanencia o compromiso minimo?",
    respuesta:
      "No. Todos nuestros planes son mensuales y puedes cancelar en cualquier momento. Sin letra pequena, sin penalizaciones.",
  },
  {
    pregunta: "¿Mis jugadores necesitan descargar una app?",
    respuesta:
      "No. El portal de jugadores funciona directamente desde el navegador del movil. Sin descargas, sin actualizaciones. Funciona como una app pero sin las complicaciones.",
  },
  {
    pregunta: "¿Ofreceis soporte en espanol?",
    respuesta:
      "Por supuesto. Somos un equipo espanol y todo nuestro soporte es en espanol. Nada de chatbots en ingles ni traducciones automaticas.",
  },
]

export default function ContactoPage() {
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
            Volver al inicio
          </Link>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Hablemos</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Tienes una pregunta, una idea o simplemente quieres saber mas?
            Estamos aqui para ayudarte.
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
              Preguntas frecuentes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Resolvemos las dudas mas comunes sobre Padel Club OS.
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
          <h3 className="mt-4 text-xl font-semibold">Con sede en Espana</h3>
          <p className="mt-2 text-muted-foreground">
            Trabajamos en remoto desde diferentes ciudades espanolas. Nuestro corazon
            esta en las pistas de padel de todo el pais.
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
                Prefieres verlo en accion?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                Crea tu cuenta y configura tu club en menos de 5 minutos. Sin compromiso,
                sin tarjeta de credito.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 text-base"
                  asChild
                >
                  <Link href="/register">
                    Empezar ahora
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/#precios">Ver precios</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
