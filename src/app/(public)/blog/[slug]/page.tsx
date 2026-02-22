import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"

interface BlogPostPageProps {
  params: { slug: string }
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await db.blogPost.findFirst({
    where: { slug: params.slug, published: true },
    select: { title: true, excerpt: true },
  })

  if (!post) return { title: "Articulo no encontrado | Padel Club OS" }

  return {
    title: `${post.title} | Blog Padel Club OS`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
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
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="container pb-8 pt-24 md:pt-32">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al blog
          </Link>
        </div>
      </section>

      <article className="container mx-auto max-w-3xl pb-24">
        <Badge variant="secondary" className="text-xs">
          {post.category}
        </Badge>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {iniciales}
          </div>
          <div className="text-sm">
            <span className="font-medium">{post.authorName}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {new Date(post.createdAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              {post.readTime && (
                <>
                  <span>&middot;</span>
                  <span>{post.readTime} lectura</span>
                </>
              )}
            </div>
          </div>
        </div>

        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="mt-8 w-full rounded-xl object-cover"
          />
        )}

        <div className="mt-8 space-y-4 text-foreground leading-relaxed">
          {post.content.split("\n").map((paragraph, i) =>
            paragraph.trim() ? (
              <p key={i}>{paragraph}</p>
            ) : null
          )}
        </div>
      </article>
    </>
  )
}
