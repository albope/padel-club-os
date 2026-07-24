import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { validarBody } from "@/lib/validation"

const TAG = "LEADS"

const patchSchema = z.object({
  leido: z.boolean(),
})

export async function PATCH(req: Request, props: { params: Promise<{ leadId: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAuth("leads:update")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const result = validarBody(patchSchema, body)
    if (!result.success) return result.response

    const lead = await db.contactSubmission.findUnique({
      where: { id: params.leadId },
    })
    if (!lead) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    const actualizado = await db.contactSubmission.update({
      where: { id: params.leadId },
      data: { leido: result.data.leido },
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    logger.error(TAG, "Error al actualizar lead", { leadId: params.leadId }, error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
