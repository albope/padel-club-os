import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import * as z from "zod"

const NewsUpdateSchema = z.object({
  title: z.string().min(3, "El titulo debe tener al menos 3 caracteres.").max(200, "El titulo no puede superar 200 caracteres.").optional(),
  content: z.string().min(1, "El contenido es requerido.").max(50000, "El contenido es demasiado largo.").optional(),
  published: z.boolean().optional(),
  imageUrl: z.string().url("URL no valida").max(2000).optional().nullable().or(z.literal("")),
})

// GET: Obtener una noticia por ID
export async function GET(
  req: Request,
  { params }: { params: { newsId: string } }
) {
  try {
    const auth = await requireAuth("news:read")
    if (isAuthError(auth)) return auth

    const noticia = await db.news.findUnique({
      where: { id: params.newsId, clubId: auth.session.user.clubId },
    })

    if (!noticia) {
      return NextResponse.json(
        { error: "Noticia no encontrada." },
        { status: 404 }
      )
    }

    return NextResponse.json(noticia)
  } catch (error) {
    logger.error("NEWS_GET_ONE", "Error al obtener noticia", { ruta: "/api/news/[newsId]" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// PATCH: Actualizar noticia
export async function PATCH(
  req: Request,
  { params }: { params: { newsId: string } }
) {
  try {
    const auth = await requireAuth("news:update")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const parsed = NewsUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const data = { ...parsed.data }
    // Normalizar imageUrl vacia a null
    if (data.imageUrl === "") data.imageUrl = null

    const noticia = await db.news.update({
      where: { id: params.newsId, clubId: auth.session.user.clubId },
      data,
    })

    return NextResponse.json(noticia)
  } catch (error) {
    logger.error("NEWS_UPDATE", "Error al actualizar noticia", { ruta: "/api/news/[newsId]" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// DELETE: Eliminar noticia
export async function DELETE(
  req: Request,
  { params }: { params: { newsId: string } }
) {
  try {
    const auth = await requireAuth("news:delete")
    if (isAuthError(auth)) return auth

    await db.news.delete({
      where: { id: params.newsId, clubId: auth.session.user.clubId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error("NEWS_DELETE", "Error al eliminar noticia", { ruta: "/api/news/[newsId]" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
