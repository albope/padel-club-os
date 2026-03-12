import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { logger } from "@/lib/logger"
import { buscarConflictos, cancelarReservasPorBloqueo } from "@/lib/court-blocks"
import { CourtBlockReason } from "@prisma/client"

const ActualizarBloqueoSchema = z.object({
  courtId: z.string().min(1).nullable().optional(),
  reason: z.nativeEnum(CourtBlockReason).optional(),
  note: z.string().max(300).nullable().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  cancelConflicting: z.boolean().optional(),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return new Date(data.startTime) < new Date(data.endTime)
  }
  return true
}, { message: "La hora de inicio debe ser anterior a la hora de fin" })

// GET: Detalle de un bloqueo
export async function GET(
  req: Request,
  { params }: { params: { blockId: string } }
) {
  try {
    const auth = await requireAuth("court-blocks:read")
    if (isAuthError(auth)) return auth

    const bloqueo = await db.courtBlock.findFirst({
      where: { id: params.blockId, clubId: auth.session.user.clubId },
      include: {
        court: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    })

    if (!bloqueo) {
      return NextResponse.json({ error: "Bloqueo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(bloqueo)
  } catch (error) {
    logger.error("COURT_BLOCK_GET", "Error al obtener bloqueo", { blockId: params.blockId }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// PATCH: Actualizar bloqueo (misma politica de conflictos que POST)
export async function PATCH(
  req: Request,
  { params }: { params: { blockId: string } }
) {
  try {
    const auth = await requireAuth("court-blocks:update")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const parsed = ActualizarBloqueoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const existente = await db.courtBlock.findFirst({
      where: { id: params.blockId, clubId: auth.session.user.clubId },
    })
    if (!existente) {
      return NextResponse.json({ error: "Bloqueo no encontrado" }, { status: 404 })
    }

    const { cancelConflicting, ...updateFields } = parsed.data
    const courtId = updateFields.courtId !== undefined ? (updateFields.courtId ?? null) : existente.courtId
    const startTime = updateFields.startTime ? new Date(updateFields.startTime) : existente.startTime
    const endTime = updateFields.endTime ? new Date(updateFields.endTime) : existente.endTime

    // Validar coherencia temporal
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "La hora de inicio debe ser anterior a la hora de fin" },
        { status: 400 }
      )
    }

    // Si cambiaron tiempos o pista, verificar conflictos
    const cambioRango =
      updateFields.startTime || updateFields.endTime || updateFields.courtId !== undefined

    if (cambioRango) {
      // Si courtId especifico, verificar que existe
      if (courtId) {
        const court = await db.court.findFirst({
          where: { id: courtId, clubId: auth.session.user.clubId },
        })
        if (!court) {
          return NextResponse.json({ error: "Pista no encontrada" }, { status: 404 })
        }
      }

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

      if (conflictos.length > 0 && cancelConflicting) {
        const reason = updateFields.reason ?? existente.reason
        const note = updateFields.note !== undefined ? updateFields.note : existente.note
        await cancelarReservasPorBloqueo(
          bookingsConDetalle,
          reason,
          note ?? null,
          auth.session.user.clubId
        )
      }
    }

    // Aplicar actualizacion
    const data: Record<string, unknown> = {}
    if (updateFields.reason !== undefined) data.reason = updateFields.reason
    if (updateFields.note !== undefined) data.note = updateFields.note
    if (updateFields.startTime) data.startTime = startTime
    if (updateFields.endTime) data.endTime = endTime
    if (updateFields.courtId !== undefined) data.courtId = updateFields.courtId ?? null

    const actualizado = await db.courtBlock.update({
      where: { id: params.blockId },
      data,
      include: {
        court: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    })

    logger.info("COURT_BLOCK_UPDATED", "Bloqueo de pista actualizado", {
      blockId: params.blockId,
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    logger.error("COURT_BLOCK_PATCH", "Error al actualizar bloqueo", { blockId: params.blockId }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// DELETE: Eliminar bloqueo (hard delete)
export async function DELETE(
  req: Request,
  { params }: { params: { blockId: string } }
) {
  try {
    const auth = await requireAuth("court-blocks:delete")
    if (isAuthError(auth)) return auth

    const bloqueo = await db.courtBlock.findFirst({
      where: { id: params.blockId, clubId: auth.session.user.clubId },
    })
    if (!bloqueo) {
      return NextResponse.json({ error: "Bloqueo no encontrado" }, { status: 404 })
    }

    await db.courtBlock.delete({ where: { id: params.blockId } })

    logger.info("COURT_BLOCK_DELETED", "Bloqueo de pista eliminado", {
      blockId: params.blockId,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error("COURT_BLOCK_DELETE", "Error al eliminar bloqueo", { blockId: params.blockId }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
