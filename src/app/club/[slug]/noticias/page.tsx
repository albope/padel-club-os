import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Newspaper } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default async function ClubNewsPage({ params }: { params: { slug: string } }) {
  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })

  if (!club) notFound()

  const news = await db.news.findMany({
    where: { clubId: club.id, published: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Noticias</h1>
        <p className="text-muted-foreground mt-1">Novedades y comunicados del club</p>
        <div className="club-accent-line mt-3" />
      </div>

      {news.length > 0 ? (
        <div className="grid gap-4">
          {news.map((item) => (
            <Link key={item.id} href={`/club/${params.slug}/noticias/${item.id}`}>
              <div className="club-card overflow-hidden">
                <div className="p-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-xl mb-4"
                    />
                  )}
                  <h2 className="font-display font-bold text-foreground">{item.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {item.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(item.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">No hay noticias</p>
            <p className="text-sm text-muted-foreground mt-1">
              El club aún no ha publicado noticias.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
