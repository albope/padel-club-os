import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import * as z from "zod"
import { notificarClub } from "@/lib/notifications"

const NewsCreateSchema = z.object({
  title: z.string().min(3, "El titulo debe tener al menos 3 caracteres."),
  content: z.string().min(1, "El contenido es requerido."),
  published: z.boolean().optional().default(false),
  imageUrl: z.string().url("URL no valida").optional().or(z.literal("")).or(z.literal(null)),
})

// GET: Listar todas las noticias del club (admin)
export async function GET() {
  try {
    const auth = await requireAuth("news:read")
    if (isAuthError(auth)) return auth

    const news = await db.news.findMany({
      where: { clubId: auth.session.user.clubId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error("[NEWS_GET_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST: Crear nueva noticia
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("news:create")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const parsed = NewsCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { title, content, published, imageUrl } = parsed.data

    const noticia = await db.news.create({
      data: {
        title,
        content,
        published,
        imageUrl: imageUrl || null,
        clubId: auth.session.user.clubId,
      },
    })

    // Si la noticia se publica directamente, notificar a jugadores
    if (published) {
      notificarClub({
        tipo: "news_published",
        titulo: "Nueva noticia del club",
        mensaje: title,
        clubId: auth.session.user.clubId,
        metadata: { newsId: noticia.id },
        url: "/noticias",
      }).catch(() => {})
    }

    return NextResponse.json(noticia, { status: 201 })
  } catch (error) {
    console.error("[NEWS_CREATE_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
