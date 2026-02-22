import { db } from "@/lib/db"
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

    return NextResponse.json(post)
  } catch (error) {
    console.error("[BLOG_PUBLIC_GET_ONE_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
