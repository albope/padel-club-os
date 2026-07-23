import { Metadata } from "next"
import Link from "next/link"
import { FileText } from "lucide-react"
import { db } from "@/lib/db"
import { getLocale } from "next-intl/server"
import { PlaceholderFoto, claseCategoria, chipCategoriaBase } from "@/components/marketing/PlaceholderFoto"

export const revalidate = 86400 // 24h

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Articulos sobre gestion de clubes de padel, producto, consejos y novedades de Padel Club OS.",
  openGraph: {
    title: "Blog - Padel Club OS",
    description:
      "Articulos sobre gestion de clubes de padel, producto, consejos y novedades de Padel Club OS.",
    url: "/blog",
  },
  alternates: {
    canonical: "/blog",
  },
}

function obtenerIniciales(nombre: string) {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatearFecha(fecha: Date, localeCode: string) {
  return new Date(fecha).toLocaleDateString(localeCode, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function BlogPage() {
  const locale = await getLocale()
  const localeCode = locale === "es" ? "es-ES" : "en-GB"
  const posts = await db.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  })

  const [postDestacado, ...restoArticulos] = posts

  return (
    <>
      {/* Cabecera */}
      <section className="container grid gap-3.5 pb-10 pt-16 md:pt-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="font-mono" aria-hidden="true">
            &#9666;
          </span>{" "}
          Volver al inicio
        </Link>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl lg:text-[52px]" style={{ fontWeight: 800 }}>
          Blog
        </h1>
        <p className="max-w-[560px] text-base text-muted-foreground">
          Ideas, consejos y novedades para la gestion moderna de clubes de padel.
        </p>
      </section>

      {!postDestacado ? (
        <section className="container pb-24">
          <div className="grid justify-items-center gap-3 rounded-[var(--radius-surface)] border border-border bg-surface-raised py-20 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <h2 className="font-display text-xl font-bold">Proximamente</h2>
            <p className="text-muted-foreground">
              Estamos preparando articulos sobre gestion de clubes de padel.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Destacado (isla oscura) */}
          <section className="container pb-10">
            <div className="dark">
              <Link
                href={`/blog/${postDestacado.slug}`}
                className="theme-marcador grid overflow-hidden rounded-[var(--radius-surface)] bg-card text-foreground md:grid-cols-[1.2fr_1fr]"
              >
                <div className="grid content-center gap-4 p-8 md:p-11">
                  <span className={`${chipCategoriaBase} border-transparent bg-primary-hover text-primary-foreground`}>
                    {postDestacado.category}
                  </span>
                  <h2 className="font-display text-2xl leading-tight tracking-tight text-balance md:text-[32px]" style={{ fontWeight: 750 }}>
                    {postDestacado.title}
                  </h2>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {postDestacado.excerpt}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[13px] text-muted-foreground">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[10.5px] font-bold text-primary-foreground">
                      {obtenerIniciales(postDestacado.authorName)}
                    </span>
                    <span className="text-foreground">{postDestacado.authorName}</span>
                    <span>&middot;</span>
                    <span>{formatearFecha(postDestacado.createdAt, localeCode)}</span>
                    {postDestacado.readTime && (
                      <>
                        <span>&middot;</span>
                        <span className="[font-variant-numeric:tabular-nums]">
                          {postDestacado.readTime} lectura
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <PlaceholderFoto
                  variant="oscuro"
                  label="FOTO · portada del artículo"
                  className="min-h-[240px] md:min-h-[320px]"
                />
              </Link>
            </div>
          </section>

          {/* Grid del resto */}
          {restoArticulos.length > 0 && (
            <section className="container pb-24">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restoArticulos.map((articulo) => (
                  <Link
                    key={articulo.id}
                    href={`/blog/${articulo.slug}`}
                    className="group grid content-start overflow-hidden rounded-[var(--radius-surface)] border border-border bg-surface-raised text-foreground transition-shadow hover:shadow-[0_8px_24px_-12px_hsl(36_8%_10%/0.25)]"
                  >
                    <PlaceholderFoto className="h-[150px]" />
                    <div className="grid content-start gap-2.5 p-6">
                      <span className={`${chipCategoriaBase} ${claseCategoria(articulo.category)}`}>
                        {articulo.category}
                      </span>
                      <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-balance">
                        {articulo.title}
                      </h3>
                      <p className="line-clamp-2 text-[13.5px] leading-relaxed text-muted-foreground">
                        {articulo.excerpt}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[9.5px] font-bold text-primary-foreground">
                          {obtenerIniciales(articulo.authorName)}
                        </span>
                        <span className="font-medium text-foreground">{articulo.authorName}</span>
                        <span>&middot;</span>
                        <span>{formatearFecha(articulo.createdAt, localeCode)}</span>
                        {articulo.readTime && (
                          <>
                            <span>&middot;</span>
                            <span className="[font-variant-numeric:tabular-nums]">{articulo.readTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  )
}
