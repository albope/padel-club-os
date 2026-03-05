import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { SITE_URL } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Paginas estaticas publicas
  const paginasEstaticas: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/sobre-nosotros`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contacto`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacidad`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terminos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cookies`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  // Contenido dinamico (puede fallar si no hay DB disponible, ej. CI)
  let paginasBlog: MetadataRoute.Sitemap = []
  let paginasClub: MetadataRoute.Sitemap = []

  try {
    const blogPosts = await db.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    })

    paginasBlog = blogPosts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

    const clubs = await db.club.findMany({
      where: {
        subscriptionStatus: { in: ["active", "trialing"] },
      },
      select: { slug: true },
    })

    paginasClub = clubs.map((club) => ({
      url: `${SITE_URL}/club/${club.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }))
  } catch {
    // Sin DB disponible (CI/build), devolver solo paginas estaticas
  }

  return [...paginasEstaticas, ...paginasBlog, ...paginasClub]
}
