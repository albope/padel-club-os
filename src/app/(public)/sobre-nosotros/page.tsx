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

export const metadata: Metadata = {
  title: "Sobre mi",
  description:
    "Conoce a Alberto Bort, el desarrollador detras de Padel Club OS. Mi mision es que cada club de padel en Espana tenga el software que merece.",
  openGraph: {
    title: "Sobre mi - Padel Club OS",
    description:
      "Conoce a Alberto Bort, el desarrollador detras de Padel Club OS. Mi mision es que cada club de padel en Espana tenga el software que merece.",
    url: "/sobre-nosotros",
  },
  alternates: {
    canonical: "/sobre-nosotros",
  },
}

const principios = [
  {
    icono: Sparkles,
    titulo: "Simplicidad radical",
    descripcion:
      "Si una función necesita un manual, está mal diseñada. Cada pantalla de Padel Club OS busca ser obvia.",
  },
  {
    icono: Eye,
    titulo: "Transparencia total",
    descripcion:
      "Precios públicos, sin letra pequeña, sin llamadas de ventas. Sabes lo que pagas y lo que recibes.",
  },
  {
    icono: MapPin,
    titulo: "Pensado para España",
    descripcion:
      "No es un software americano traducido. Entiendo los horarios, la cultura y las necesidades de los clubes españoles.",
  },
  {
    icono: Heart,
    titulo: "Obsesionado con el club",
    descripcion:
      "No construyo funcionalidades porque suenan bien. Las construyo porque un club real me dijo que las necesitaba.",
  },
]

const estadisticas = [
  { valor: "5 min", etiqueta: "Para configurar tu club" },
  { valor: "0 €", etiqueta: "Para empezar (14 días gratis)" },
  { valor: "24/7", etiqueta: "Reservas sin intervención" },
  { valor: "100%", etiqueta: "Pensado para pádel" },
]

const tecnologias = [
  { icono: Code, nombre: "Next.js & React", descripcion: "Aplicaciones web rápidas y modernas" },
  { icono: Smartphone, nombre: "PWA", descripcion: "Funciona offline, se instala como app nativa" },
  { icono: Zap, nombre: "TypeScript", descripcion: "Código robusto y mantenible" },
]

export default function SobreNosotrosPage() {
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
            Volver al inicio
          </Link>

          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm font-medium">
            Mi historia
          </Badge>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Los clubes de pádel merecen un software{" "}
            <span className="text-primary">a la altura</span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            Soy desarrollador web y jugador de pádel. Vi un problema: la gestión de clubes
            seguía anclada en hojas de cálculo, WhatsApp y software de los 2000. Decidí cambiarlo.
          </p>
        </div>
      </section>

      {/* Mi historia */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cómo empezó todo
          </h2>

          <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              Todo empezó reservando pista por WhatsApp. Veía a los encargados del club
              apuntando reservas en libretas, gestionando ligas en Excel y contestando
              mensajes a las 11 de la noche. Sabía que tenía que haber una forma mejor.
            </p>

            <div className="border-l-4 border-primary pl-6">
              <p className="font-medium text-foreground">
                &ldquo;Quería construir la herramienta que me hubiera gustado encontrar
                como jugador y que cualquier club pudiera usar desde el primer día.&rdquo;
              </p>
            </div>

            <p>
              Como desarrollador especializado en aplicaciones web modernas y PWAs,
              tenía las herramientas para hacerlo. Así nació Padel Club OS: una plataforma
              pensada desde cero para clubes de pádel en España. Sin traducciones forzadas
              de software americano, sin funcionalidades de golf o tenis que nadie necesita.
              Sólo lo esencial, bien hecho.
            </p>
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
                  Desarrollador Web & Arquitecto PWA
                </p>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  Desarrollo aplicaciones web modernas y Progressive Web Apps que cargan rápido,
                  funcionan offline y convierten visitantes en clientes. Padel Club OS es el
                  resultado de combinar mi experiencia técnica con mi pasión por el pádel.
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
              Mis principios
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Las ideas que guían cada decisión que tomo.
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
              Diseñado para simplificar
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Todo lo que necesitas para gestionar tu club, desde el primer día.
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
                Forma parte del cambio
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                Prueba Padel Club OS gratis durante 14 días y descubre lo fácil
                que es gestionar tu club.
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
