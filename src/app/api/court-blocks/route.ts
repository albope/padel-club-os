import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { logger } from "@/lib/logger"
import { buscarConflictos, cancelarReservasPorBloqueo } from "@/lib/court-blocks"
import { CourtBlockReason } from "@prisma/client"

const CrearBloqueoSchema = z.object({
  courtId: z.string().min(1).nullable().optional(),
  reason: z.nativeEnum(CourtBlockReason),
  note: z.string().max(300).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  cancelConflicting: z.boolean().optional(),
}).refine((data) => new Date(data.startTime) < new Date(data.endTime), {
  message: "La hora de inicio debe ser anterior a la hora de fin",
})

// GET: Lista bloqueos del club
export async function GET(req: Request) {
  try {
    const auth = await requireAuth("court-blocks:read")
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const courtId = searchParams.get("courtId")

    const where: Record<string, unknown> = {
      clubId: auth.session.user.clubId,
    }

    if (from || to) {
      const dateFilters: Record<string, unknown> = {}
      if (from) dateFilters.gte = new Date(`${from}T00:00:00`)
      if (to) dateFilters.lte = new Date(`${to}T23:59:59`)
      where.startTime = dateFilters
    }

    if (courtId) {
      where.courtId = courtId
    }

    const bloqueos = await db.courtBlock.findMany({
      where,
      include: {
        court: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { startTime: "desc" },
    })

    return NextResponse.json(bloqueos)
  } catch (error) {
    logger.error("COURT_BLOCKS_GET", "Error al listar bloqueos", { ruta: "/api/court-blocks" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST: Crear bloqueo
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("court-blocks:create")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const parsed = CrearBloqueoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { reason, note, cancelConflicting } = parsed.data
    const courtId = parsed.data.courtId ?? null
    const startTime = new Date(parsed.data.startTime)
    const endTime = new Date(parsed.data.endTime)

    // Validar que es futuro
    if (startTime <= new Date()) {
      return NextResponse.json(
        { error: "El bloqueo debe ser en el futuro" },
        { status: 400 }
      )
    }

    // Si courtId especifico, verificar que existe en el club
    if (courtId) {
      const court = await db.court.findFirst({
        where: { id: courtId, clubId: auth.session.user.clubId },
      })
      if (!court) {
        return NextResponse.json({ error: "Pista no encontrada" }, { status: 404 })
      }
    }

    // Buscar conflictos
    const { conflictos, bookingsConDetalle } = await buscarConflictos(
      auth.session.user.clubId,
      courtId,
      startTime,
      endTime
    )

    if (conflictos.length > 0 && !cancelConflicting) {
      return NextResponse.json(
        { error: "Existen reservas en conflicto", conflicts: conflictos },
        { status: 409 }
      )
    }

    // Cancelar conflictos si se solicito
    if (conflictos.length > 0 && cancelConflicting) {
      await cancelarReservasPorBloqueo(
        bookingsConDetalle,
        reason,
        note ?? null,
        auth.session.user.clubId
      )
    }

    // Crear bloqueo
    const bloqueo = await db.courtBlock.create({
      data: {
        reason,
        note: note ?? null,
        startTime,
        endTime,
        courtId,
        clubId: auth.session.user.clubId,
        createdById: auth.session.user.id,
      },
      include: {
        court: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    })

    logger.info("COURT_BLOCK_CREATED", "Bloqueo de pista creado", {
      blockId: bloqueo.id,
      courtId,
      reason,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      conflictosCancelados: conflictos.length,
    })

    return NextResponse.json(bloqueo, { status: 201 })
  } catch (error) {
    logger.error("COURT_BLOCKS_POST", "Error al crear bloqueo", { ruta: "/api/court-blocks" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
