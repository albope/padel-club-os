import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { validarBody } from "@/lib/validation"
import { resolverSegmento, enviarBroadcast } from "@/lib/broadcast"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { NextResponse } from "next/server"
import * as z from "zod"

const limitadorBroadcast = crearRateLimiter({ maxRequests: 5, windowMs: 3600000 }) // 5 por hora

const BroadcastCreateSchema = z.object({
  titulo: z.string().min(1, "El titulo es requerido").max(100, "Maximo 100 caracteres"),
  mensaje: z.string().min(1, "El mensaje es requerido").max(2000, "Maximo 2000 caracteres"),
  canales: z.enum(["push", "email", "push+email"], {
    errorMap: () => ({ message: "Canal invalido. Opciones: push, email, push+email" }),
  }),
  segmento: z.string().min(1, "El segmento es requerido").max(50, "Segmento invalido"),
})

// GET: Listar historial de broadcasts del club
export async function GET() {
  try {
    const auth = await requireAuth("broadcast:read")
    if (isAuthError(auth)) return auth

    const broadcasts = await db.broadcast.findMany({
      where: { clubId: auth.session.user.clubId },
      include: { sentBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json(broadcasts)
  } catch (error) {
    logger.error("BROADCASTS", "Error al listar broadcasts", {}, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST: Crear y enviar broadcast
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("broadcast:create", { requireSubscription: true })
    if (isAuthError(auth)) return auth

    // Rate limiting
    const ip = obtenerIP(req)
    if (!limitadorBroadcast.verificar(ip)) {
      return NextResponse.json(
        { error: "Has enviado demasiadas comunicaciones. Intenta de nuevo mas tarde." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const result = validarBody(BroadcastCreateSchema, body)
    if (!result.success) return result.response

    const { titulo, mensaje, canales, segmento } = result.data

    // Contar destinatarios
    const where = resolverSegmento(segmento, auth.session.user.clubId)
    const recipientCount = await db.user.count({ where })

    if (recipientCount === 0) {
      return NextResponse.json(
        { error: "No hay destinatarios que coincidan con el segmento seleccionado." },
        { status: 400 }
      )
    }

    // Obtener info del club para emails
    const club = await db.club.findUnique({
      where: { id: auth.session.user.clubId },
      select: { name: true, slug: true },
    })

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado." }, { status: 404 })
    }

    // Crear registro de broadcast
    const broadcast = await db.broadcast.create({
      data: {
        title: titulo,
        message: mensaje,
        channels: canales,
        segment: segmento,
        recipientCount,
        status: "sending",
        sentById: auth.session.user.id,
        clubId: auth.session.user.clubId,
      },
    })

    // Fire-and-forget: enviar en background
    enviarBroadcast({
      broadcastId: broadcast.id,
      clubId: auth.session.user.clubId,
      clubNombre: club.name,
      clubSlug: club.slug,
      titulo,
      mensaje,
      canales,
      segmento,
    }).catch(async (error) => {
      logger.error("BROADCAST", "Error en envio masivo", { broadcastId: broadcast.id }, error)
      await db.broadcast.update({
        where: { id: broadcast.id },
        data: { status: "failed" },
      }).catch(() => {})
    })

    return NextResponse.json(
      { id: broadcast.id, recipientCount, message: "Comunicacion en proceso de envio." },
      { status: 202 }
    )
  } catch (error) {
    logger.error("BROADCASTS", "Error al crear broadcast", {}, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
