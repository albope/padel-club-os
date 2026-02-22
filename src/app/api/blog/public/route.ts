import { db } from "@/lib/db"
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

    return NextResponse.json(posts)
  } catch (error) {
    console.error("[BLOG_PUBLIC_GET_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
