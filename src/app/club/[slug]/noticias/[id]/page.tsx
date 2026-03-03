import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getLocale } from "next-intl/server"

export const revalidate = 1800 // 30min

export default async function ClubNewsDetailPage({
  params,
}: {
  params: { slug: string; id: string }
}) {
  const locale = await getLocale()
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB'
  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })

  if (!club) notFound()

  const noticia = await db.news.findFirst({
    where: { id: params.id, clubId: club.id, published: true },
  })

  if (!noticia) notFound()

  return (
    <div className="space-y-6">
      <Link href={`/club/${params.slug}/noticias`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a noticias
        </Button>
      </Link>

      <article className="max-w-3xl">
        {noticia.imageUrl && (
          <div className="relative w-full h-64 mb-6">
            <Image
              src={noticia.imageUrl}
              alt={noticia.title}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {noticia.title}
        </h1>

        <p className="text-sm text-muted-foreground mt-2">
          {new Date(noticia.createdAt).toLocaleDateString(localeCode, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="mt-6 space-y-4 text-foreground leading-relaxed">
          {noticia.content.split("\n").map((paragraph, i) =>
            paragraph.trim() ? (
              <p key={i}>{paragraph}</p>
            ) : (
              <br key={i} />
            )
          )}
        </div>
      </article>
    </div>
  )
}
