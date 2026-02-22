import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import * as z from "zod"

const BlogCreateSchema = z.object({
  title: z.string().min(3, "El titulo debe tener al menos 3 caracteres."),
  slug: z
    .string()
    .min(3, "El slug debe tener al menos 3 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo puede contener letras minusculas, numeros y guiones."
    ),
  content: z.string().min(1, "El contenido es requerido."),
  excerpt: z.string().min(10, "El extracto debe tener al menos 10 caracteres."),
  category: z.string().min(1, "La categoria es requerida."),
  published: z.boolean().optional().default(false),
  imageUrl: z
    .string()
    .url("URL no valida")
    .optional()
    .or(z.literal(""))
    .or(z.literal(null)),
  authorName: z.string().min(2, "El nombre del autor es requerido."),
  readTime: z.string().optional().or(z.literal("")),
})

// GET: Listar todos los posts del blog (admin)
export async function GET() {
  try {
    const auth = await requireAuth("blog:read")
    if (isAuthError(auth)) return auth

    const posts = await db.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("[BLOG_GET_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST: Crear nuevo post
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("blog:create")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const parsed = BlogCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const {
      title,
      slug,
      content,
      excerpt,
      category,
      published,
      imageUrl,
      authorName,
      readTime,
    } = parsed.data

    // Verificar slug unico
    const existente = await db.blogPost.findUnique({ where: { slug } })
    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un articulo con ese slug." },
        { status: 409 }
      )
    }

    const post = await db.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        category,
        published,
        imageUrl: imageUrl || null,
        authorName,
        readTime: readTime || null,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("[BLOG_CREATE_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
