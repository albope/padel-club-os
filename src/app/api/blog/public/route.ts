import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

// GET: Listar posts publicados (publico, sin auth)
export async function GET() {
  try {
    const posts = await db.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        imageUrl: true,
        authorName: true,
        readTime: true,
        createdAt: true,
      },
    })

    return NextResponse.json(posts, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  } catch (error) {
    logger.error("BLOG_PUBLIC_GET", "Error al listar posts publicos del blog", { ruta: "/api/blog/public" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
