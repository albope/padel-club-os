import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import * as z from "zod"

const BlogUpdateSchema = z.object({
  title: z
    .string()
    .min(3, "El titulo debe tener al menos 3 caracteres.")
    .optional(),
  slug: z
    .string()
    .min(3, "El slug debe tener al menos 3 caracteres.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug no valido.")
    .optional(),
  content: z.string().min(1, "El contenido es requerido.").optional(),
  excerpt: z
    .string()
    .min(10, "El extracto debe tener al menos 10 caracteres.")
    .optional(),
  category: z.string().min(1).optional(),
  published: z.boolean().optional(),
  imageUrl: z
    .string()
    .url("URL no valida")
    .optional()
    .nullable()
    .or(z.literal("")),
  authorName: z.string().min(2).optional(),
  readTime: z.string().optional().nullable().or(z.literal("")),
})

// GET: Obtener un post por ID (admin)
export async function GET(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const auth = await requireAuth("blog:read")
    if (isAuthError(auth)) return auth

    const post = await db.blogPost.findUnique({
      where: { id: params.postId },
    })

    if (!post) {
      return NextResponse.json(
        { error: "Articulo no encontrado." },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("[BLOG_GET_ONE_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// PATCH: Actualizar post
export async function PATCH(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const auth = await requireAuth("blog:update")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const parsed = BlogUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const data = { ...parsed.data }
    if (data.imageUrl === "") data.imageUrl = null
    if (data.readTime === "") data.readTime = null

    // Si cambia el slug, verificar que sea unico
    if (data.slug) {
      const existente = await db.blogPost.findFirst({
        where: { slug: data.slug, NOT: { id: params.postId } },
      })
      if (existente) {
        return NextResponse.json(
          { error: "Ya existe un articulo con ese slug." },
          { status: 409 }
        )
      }
    }

    const post = await db.blogPost.update({
      where: { id: params.postId },
      data,
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("[BLOG_UPDATE_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// DELETE: Eliminar post
export async function DELETE(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const auth = await requireAuth("blog:delete")
    if (isAuthError(auth)) return auth

    await db.blogPost.delete({
      where: { id: params.postId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[BLOG_DELETE_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
