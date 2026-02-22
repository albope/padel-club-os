import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  title: "Blog | Padel Club OS",
  description:
    "Articulos sobre gestion de clubes de padel, producto, consejos y novedades de Padel Club OS.",
}

function obtenerIniciales(nombre: string) {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatearFecha(fecha: Date) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function BlogPage() {
  const posts = await db.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  })

  const [postDestacado, ...restoArticulos] = posts

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
          {!postDestacado ? (
            <div className="text-center py-16">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">Proximamente</h2>
              <p className="mt-2 text-muted-foreground">
                Estamos preparando articulos sobre gestion de clubes de padel.
              </p>
            </div>
          ) : (
            <>
              {/* Post destacado */}
              <Link href={`/blog/${postDestacado.slug}`}>
                <div className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
                  <div className="grid md:grid-cols-5">
                    <div className="flex items-center justify-center bg-muted/50 p-12 md:col-span-3 md:p-16">
                      {postDestacado.imageUrl ? (
                        <img
                          src={postDestacado.imageUrl}
                          alt={postDestacado.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center p-6 md:col-span-2 md:p-8">
                      <Badge variant="secondary" className="w-fit text-xs">
                        {postDestacado.category}
                      </Badge>
                      <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl group-hover:text-primary transition-colors">
                        {postDestacado.title}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {postDestacado.excerpt}
                      </p>
                      <div className="mt-6 flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, hsl(217,91%,52%) 0%, hsl(197,85%,48%) 100%)",
                          }}
                        >
                          {obtenerIniciales(postDestacado.authorName)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{postDestacado.authorName}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatearFecha(postDestacado.createdAt)}</span>
                            {postDestacado.readTime && (
                              <>
                                <span>&middot;</span>
                                <span>{postDestacado.readTime} lectura</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Grid de articulos */}
              {restoArticulos.length > 0 && (
                <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {restoArticulos.map((articulo) => (
                    <Link key={articulo.id} href={`/blog/${articulo.slug}`}>
                      <div className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md h-full">
                        <div className="relative aspect-[16/9] bg-muted/50">
                          {articulo.imageUrl ? (
                            <img
                              src={articulo.imageUrl}
                              alt={articulo.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <FileText className="h-8 w-8 text-muted-foreground/20" />
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <Badge variant="secondary" className="text-xs">
                            {articulo.category}
                          </Badge>
                          <h3 className="mt-3 text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                            {articulo.title}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {articulo.excerpt}
                          </p>

                          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white bg-primary"
                            >
                              {obtenerIniciales(articulo.authorName)}
                            </div>
                            <span className="font-medium text-foreground">
                              {articulo.authorName}
                            </span>
                            <span>&middot;</span>
                            <span>{formatearFecha(articulo.createdAt)}</span>
                            {articulo.readTime && (
                              <>
                                <span>&middot;</span>
                                <span>{articulo.readTime}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
