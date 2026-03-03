import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { validarBody } from "@/lib/validation"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import * as z from "zod"

const rateLimiterChat = crearRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 10 mensajes por minuto
})

const EnviarMensajeSchema = z.object({
  content: z.string().min(1, "Mensaje vacio").max(500, "Maximo 500 caracteres").trim(),
})

// GET: Obtener mensajes del chat de una partida
export async function GET(
  req: Request,
  { params }: { params: { openMatchId: string } }
) {
  try {
    const auth = await requireAuth("chat:read")
    if (isAuthError(auth)) return auth

    const userId = auth.session.user.id
    const clubId = auth.session.user.clubId

    // Verificar que la partida existe y pertenece al club
    const openMatch = await db.openMatch.findFirst({
      where: { id: params.openMatchId, clubId },
      include: {
        players: { select: { userId: true } },
      },
    })

    if (!openMatch) {
      return NextResponse.json({ error: "Partida no encontrada." }, { status: 404 })
    }

    // Verificar que el usuario es participante o tiene permisos admin (users:read)
    const esParticipante = openMatch.players.some((p) => p.userId === userId)
    if (!esParticipante) {
      // Admin/staff pueden observar si tienen users:read
      const authAdmin = await requireAuth("users:read")
      if (isAuthError(authAdmin)) {
        return NextResponse.json({ error: "No participas en esta partida." }, { status: 403 })
      }
    }

    const { searchParams } = new URL(req.url)
    const since = searchParams.get("since")

    const whereClause = {
      openMatchId: params.openMatchId,
      clubId,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    }

    const messages = await db.chatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      take: 100,
      select: {
        id: true,
        content: true,
        authorId: true,
        createdAt: true,
        author: {
          select: { name: true, image: true },
        },
      },
    })

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        authorId: m.authorId,
        authorName: m.author.name || "Jugador",
        authorImage: m.author.image,
        esPropio: m.authorId === userId,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logger.error("GET_CHAT", "Error al obtener mensajes del chat", { openMatchId: params.openMatchId }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST: Enviar mensaje al chat de una partida
export async function POST(
  req: Request,
  { params }: { params: { openMatchId: string } }
) {
  try {
    const auth = await requireAuth("chat:write")
    if (isAuthError(auth)) return auth

    // Rate limiting
    const ip = obtenerIP(req)
    const rlKey = `chat:${auth.session.user.id}`
    if (!rateLimiterChat.verificar(ip || rlKey)) {
      return NextResponse.json(
        { error: "Demasiados mensajes. Espera un momento." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const result = validarBody(EnviarMensajeSchema, body)
    if (!result.success) return result.response

    const userId = auth.session.user.id
    const clubId = auth.session.user.clubId

    // Verificar partida
    const openMatch = await db.openMatch.findFirst({
      where: { id: params.openMatchId, clubId },
      include: {
        players: { select: { userId: true } },
      },
    })

    if (!openMatch) {
      return NextResponse.json({ error: "Partida no encontrada." }, { status: 404 })
    }

    // Solo participantes pueden escribir
    const esParticipante = openMatch.players.some((p) => p.userId === userId)
    if (!esParticipante) {
      return NextResponse.json({ error: "No participas en esta partida." }, { status: 403 })
    }

    // No escribir en partidas canceladas
    if (openMatch.status === "CANCELLED") {
      return NextResponse.json({ error: "La partida ha sido cancelada." }, { status: 400 })
    }

    const mensaje = await db.chatMessage.create({
      data: {
        content: result.data.content,
        openMatchId: params.openMatchId,
        authorId: userId,
        clubId,
      },
      select: {
        id: true,
        content: true,
        authorId: true,
        createdAt: true,
        author: {
          select: { name: true, image: true },
        },
      },
    })

    return NextResponse.json({
      message: {
        id: mensaje.id,
        content: mensaje.content,
        authorId: mensaje.authorId,
        authorName: mensaje.author.name || "Jugador",
        authorImage: mensaje.author.image,
        esPropio: true,
        createdAt: mensaje.createdAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error("POST_CHAT", "Error al enviar mensaje", { openMatchId: params.openMatchId }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
