import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Clock, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "Blog | Padel Club OS",
  description:
    "Articulos sobre gestion de clubes de padel, producto, consejos y novedades de Padel Club OS.",
}

const postDestacado = {
  categoria: "Producto",
  titulo: "Por que los clubes de padel necesitan digitalizarse en 2026",
  extracto:
    "La gestion manual ya no es viable. Los clubes que apuestan por la tecnologia ganan en eficiencia, satisfaccion de socios y rentabilidad. Analizamos las claves del cambio digital en el mundo del padel.",
  autor: { iniciales: "AM", nombre: "Alberto Martinez" },
  fecha: "20 Mar 2026",
  lectura: "7 min",
}

const articulos = [
  {
    categoria: "Gestion",
    titulo: "5 errores que cometen los clubes al gestionar reservas",
    extracto:
      "La mayoria de clubes pierden horas cada semana con procesos que podrian automatizarse...",
    autor: { iniciales: "AM", nombre: "Alberto M." },
    fecha: "15 Mar 2026",
    lectura: "6 min",
    color: "hsl(217,91%,52%)",
  },
  {
    categoria: "Consejos",
    titulo: "Como organizar una liga de padel desde cero",
    extracto:
      "Montar una liga no tiene por que ser un dolor de cabeza. Te contamos paso a paso como hacerlo bien...",
    autor: { iniciales: "CR", nombre: "Carlos R." },
    fecha: "10 Mar 2026",
    lectura: "8 min",
    color: "hsl(262,83%,58%)",
  },
  {
    categoria: "Producto",
    titulo: "Novedades de marzo: pagos online y notificaciones",
    extracto:
      "Este mes lanzamos dos de las funcionalidades mas pedidas por nuestros clubes...",
    autor: { iniciales: "LG", nombre: "Laura G." },
    fecha: "5 Mar 2026",
    lectura: "4 min",
    color: "hsl(142,71%,45%)",
  },
]

export default function BlogPage() {
  return (
    <>
      {/* Header */}
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

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Blog</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Ideas, consejos y novedades para la gestion moderna de clubes de padel.
          </p>
        </div>
      </section>

      {/* Articulos */}
      <section className="py-24">
        <div className="container mx-auto max-w-5xl">
          {/* Post destacado */}
          <div className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
            <Badge
              variant="outline"
              className="absolute right-4 top-4 z-10 gap-1.5 bg-background/90 backdrop-blur-sm"
            >
              <Clock className="h-3 w-3" />
              Proximamente
            </Badge>

            <div className="grid md:grid-cols-5">
              <div className="flex items-center justify-center bg-muted/50 p-12 md:col-span-3 md:p-16">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground/50">
                    Imagen del articulo
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center p-6 md:col-span-2 md:p-8">
                <Badge variant="secondary" className="w-fit text-xs">
                  {postDestacado.categoria}
                </Badge>
                <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                  {postDestacado.titulo}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {postDestacado.extracto}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(217,91%,52%) 0%, hsl(197,85%,48%) 100%)",
                    }}
                  >
                    {postDestacado.autor.iniciales}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{postDestacado.autor.nombre}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{postDestacado.fecha}</span>
                      <span>&middot;</span>
                      <span>{postDestacado.lectura} lectura</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de articulos */}
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articulos.map((articulo) => (
              <div
                key={articulo.titulo}
                className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
              >
                {/* Imagen placeholder con overlay */}
                <div className="relative aspect-[16/9] bg-muted/50">
                  <div className="flex h-full items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                    <Badge variant="outline" className="gap-1.5 bg-background/90">
                      <Clock className="h-3 w-3" />
                      Proximamente
                    </Badge>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5">
                  <Badge variant="secondary" className="text-xs">
                    {articulo.categoria}
                  </Badge>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">
                    {articulo.titulo}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {articulo.extracto}
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${articulo.color} 0%, ${articulo.color} 100%)`,
                      }}
                    >
                      {articulo.autor.iniciales}
                    </div>
                    <span className="font-medium text-foreground">
                      {articulo.autor.nombre}
                    </span>
                    <span>&middot;</span>
                    <span>{articulo.fecha}</span>
                    <span>&middot;</span>
                    <span>{articulo.lectura}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-16">
            <div className="absolute inset-0 -z-0 opacity-10">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white" />
              <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                No te pierdas nada
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                Recibe articulos sobre gestion de clubes, novedades del producto y
                consejos directamente en tu bandeja de entrada.
              </p>

              <div className="mx-auto mt-8 flex max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  className="h-11 border-primary-foreground/20 bg-white text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full text-base sm:w-auto"
                >
                  Suscribirse
                </Button>
              </div>

              <p className="mt-4 text-sm text-primary-foreground/60">
                Sin spam. Cancela cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
