import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { validarBody } from "@/lib/validation"
import { registrarAuditoria } from "@/lib/audit"

const TAG = "PLATFORM_CLUBS"

const patchSchema = z
  .object({
    extenderTrialDias: z.number().int().min(1).max(365).optional(),
    subscriptionStatus: z.enum(["trialing", "active", "canceled"]).optional(),
    subscriptionTier: z.enum(["starter", "pro", "enterprise"]).optional(),
    esDemo: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.extenderTrialDias !== undefined ||
      d.subscriptionStatus !== undefined ||
      d.subscriptionTier !== undefined ||
      d.esDemo !== undefined,
    { message: "Debes indicar al menos una accion" }
  )

export async function PATCH(req: Request, props: { params: Promise<{ clubId: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAuth("platform:manage")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const result = validarBody(patchSchema, body)
    if (!result.success) return result.response

    const club = await db.club.findUnique({
      where: { id: params.clubId },
      select: { id: true, name: true, subscriptionStatus: true, trialEndsAt: true },
    })
    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 })
    }

    const data: {
      trialEndsAt?: Date
      subscriptionStatus?: string
      subscriptionTier?: string
      esDemo?: boolean
    } = {}

    if (result.data.extenderTrialDias !== undefined) {
      const ahora = new Date()
      const baseTrial =
        club.trialEndsAt && club.trialEndsAt > ahora ? club.trialEndsAt : ahora
      data.trialEndsAt = new Date(
        baseTrial.getTime() + result.data.extenderTrialDias * 24 * 60 * 60 * 1000
      )
      // Un trial extendido sobre un club no activo lo devuelve a "trialing"
      if (club.subscriptionStatus !== "active" && result.data.subscriptionStatus === undefined) {
        data.subscriptionStatus = "trialing"
      }
    }
    if (result.data.subscriptionStatus !== undefined) {
      data.subscriptionStatus = result.data.subscriptionStatus
    }
    if (result.data.subscriptionTier !== undefined) {
      data.subscriptionTier = result.data.subscriptionTier
    }
    if (result.data.esDemo !== undefined) {
      data.esDemo = result.data.esDemo
    }

    const actualizado = await db.club.update({
      where: { id: club.id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        esDemo: true,
      },
    })

    registrarAuditoria({
      recurso: "club",
      accion: "actualizar",
      entidadId: club.id,
      detalles: { backoffice: true, cambios: result.data },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: club.id,
      clubName: club.name,
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    logger.error(TAG, "Error al actualizar club", { clubId: params.clubId }, error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
