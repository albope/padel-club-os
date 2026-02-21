import { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Eye,
  MapPin,
  Heart,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Sobre nosotros | Padel Club OS",
  description:
    "Conoce al equipo detras de Padel Club OS. Nuestra mision es que cada club de padel en Espana tenga el software que merece.",
}

const principios = [
  {
    icono: Sparkles,
    titulo: "Simplicidad radical",
    descripcion:
      "Si una funcion necesita un manual, esta mal disenada. Cada pantalla de Padel Club OS busca ser obvia.",
  },
  {
    icono: Eye,
    titulo: "Transparencia total",
    descripcion:
      "Precios publicos, sin letra pequena, sin llamadas de ventas. Sabes lo que pagas y lo que recibes.",
  },
  {
    icono: MapPin,
    titulo: "Pensado para Espana",
    descripcion:
      "No somos un software americano traducido. Entendemos los horarios, la cultura y las necesidades de los clubes espanoles.",
  },
  {
    icono: Heart,
    titulo: "Obsesionados con el club",
    descripcion:
      "No construimos funcionalidades porque suenan bien. Las construimos porque un club real nos dijo que las necesitaba.",
  },
]

const estadisticas = [
  { valor: "50+", etiqueta: "Clubes gestionados" },
  { valor: "12.000+", etiqueta: "Reservas procesadas" },
  { valor: "5.000+", etiqueta: "Jugadores activos" },
  { valor: "99.9%", etiqueta: "Uptime garantizado" },
]

const equipo = [
  {
    iniciales: "AM",
    nombre: "Alberto Martinez",
    rol: "Co-fundador & CTO",
    bio: "Ingeniero de software y jugador de padel desde hace 8 anos. Antes en startups fintech.",
    gradiente: "linear-gradient(135deg, hsl(217,91%,52%) 0%, hsl(197,85%,48%) 100%)",
  },
  {
    iniciales: "CR",
    nombre: "Carlos Ruiz",
    rol: "Co-fundador & CEO",
    bio: "Gestion de producto y estrategia. 10 anos gestionando comunidades deportivas.",
    gradiente: "linear-gradient(135deg, hsl(262,83%,58%) 0%, hsl(240,80%,62%) 100%)",
  },
  {
    iniciales: "LG",
    nombre: "Laura Garcia",
    rol: "Diseno & Producto",
    bio: "Disenadora de producto obsesionada con que cada interaccion se sienta natural.",
    gradiente: "linear-gradient(135deg, hsl(142,71%,45%) 0%, hsl(160,84%,39%) 100%)",
  },
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
            Nuestra historia
          </Badge>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Los clubes de padel merecen un software{" "}
            <span className="text-primary">a la altura</span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            Somos jugadores de padel que vimos un problema: la gestion de clubes seguia
            anclada en hojas de calculo, WhatsApp y software de los 2000. Decidimos cambiarlo.
          </p>
        </div>
      </section>

      {/* Nuestra historia */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Como empezo todo
          </h2>

          <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              Empezamos como jugadores que reservaban pista por WhatsApp. Veiamos a los
              encargados del club apuntando reservas en libretas, gestionando ligas en Excel
              y contestando mensajes a las 11 de la noche. Sabiamos que tenia que haber una
              forma mejor.
            </p>

            <div className="border-l-4 border-primary pl-6">
              <p className="font-medium text-foreground">
                &ldquo;Queríamos la herramienta que nos hubiera gustado encontrar como jugadores
                y como gestores de club.&rdquo;
              </p>
            </div>

            <p>
              En 2024 decidimos construir esa herramienta. Una plataforma moderna, pensada
              desde el principio para clubes de padel en Espana. Sin traducciones forzadas
              de software americano, sin funcionalidades de golf o tenis que nadie necesita.
              Solo lo esencial, bien hecho.
            </p>
          </div>
        </div>
      </section>

      {/* Principios */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Nuestros principios
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Las ideas que guian cada decision que tomamos.
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

      {/* Numeros */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Numeros que hablan
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Creciendo junto a los clubes que confian en nosotros.
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

      {/* Equipo */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              El equipo
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Personas reales que juegan a padel y construyen software.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-12 sm:grid-cols-3">
            {equipo.map((miembro) => (
              <div key={miembro.nombre} className="text-center">
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
                  style={{ background: miembro.gradiente }}
                >
                  {miembro.iniciales}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{miembro.nombre}</h3>
                <p className="text-sm font-medium text-primary">{miembro.rol}</p>
                <p className="mt-2 text-sm text-muted-foreground">{miembro.bio}</p>
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
                Unete a los clubes que ya confian en Padel Club OS para simplificar
                su gestion diaria.
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
