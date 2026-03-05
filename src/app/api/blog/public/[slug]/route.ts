import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

// GET: Obtener post publicado por slug (publico, sin auth)
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await db.blogPost.findFirst({
      where: { slug: params.slug, published: true },
    })

    if (!post) {
      return NextResponse.json(
        { error: "Articulo no encontrado." },
        { status: 404 }
      )
    }

    return NextResponse.json(post, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  } catch (error) {
    logger.error("BLOG_PUBLIC_GET_ONE", "Error al obtener post publico por slug", { ruta: "/api/blog/public/[slug]" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
