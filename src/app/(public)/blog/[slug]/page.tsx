import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { getLocale } from "next-intl/server"
import { claseCategoria, chipCategoriaBase } from "@/components/marketing/PlaceholderFoto"

export const revalidate = 86400 // 24h

interface BlogPostPageProps {
  params: { slug: string }
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await db.blogPost.findFirst({
    where: { slug: params.slug, published: true },
    select: { title: true, excerpt: true, imageUrl: true, authorName: true, createdAt: true },
  })

  if (!post) return { title: "Articulo no encontrado" }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url: `/blog/${params.slug}`,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: [post.authorName],
      ...(post.imageUrl && {
        images: [{ url: post.imageUrl, alt: post.title }],
      }),
    },
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const locale = await getLocale()
  const localeCode = locale === "es" ? "es-ES" : "en-GB"

  const post = await db.blogPost.findFirst({
    where: { slug: params.slug, published: true },
  })

  if (!post) notFound()

  const iniciales = post.authorName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <article className="container mx-auto max-w-[720px] pb-24 pt-12 md:pt-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="font-mono" aria-hidden="true">
          &#9666;
        </span>{" "}
        Volver al blog
      </Link>

      <div className="mt-8 grid gap-4">
        <span className={`${chipCategoriaBase} ${claseCategoria(post.category)}`}>{post.category}</span>
        <h1 className="font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-[42px]" style={{ fontWeight: 800 }}>
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {iniciales}
          </span>
          <span className="font-medium text-foreground">{post.authorName}</span>
          <span>&middot;</span>
          <span>
            {new Date(post.createdAt).toLocaleDateString(localeCode, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          {post.readTime && (
            <>
              <span>&middot;</span>
              <span className="[font-variant-numeric:tabular-nums]">{post.readTime} lectura</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-5 text-[17px] leading-[1.7] text-foreground">
        {post.content.split("\n").map((paragraph, i) =>
          paragraph.trim() ? <p key={i}>{paragraph}</p> : null
        )}
      </div>
    </article>
  )
}
