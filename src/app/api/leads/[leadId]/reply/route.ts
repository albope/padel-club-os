import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { enviarEmailRespuestaLead } from "@/lib/email"
import { logger } from "@/lib/logger"
import { validarBody } from "@/lib/validation"

const TAG = "LEADS"

const replySchema = z.object({
  asunto: z
    .string()
    .trim()
    .min(1, "El asunto es obligatorio")
    .max(160, "El asunto no puede superar 160 caracteres")
    .refine((value) => !/[\r\n]/.test(value), "El asunto no es válido"),
  mensaje: z
    .string()
    .trim()
    .min(1, "El mensaje es obligatorio")
    .max(10_000, "El mensaje no puede superar 10.000 caracteres"),
})

export async function POST(req: Request, props: { params: Promise<{ leadId: string }> }) {
  const params = await props.params

  try {
    const auth = await requireAuth("leads:update")
    if (isAuthError(auth)) return auth

    const result = validarBody(replySchema, await req.json())
    if (!result.success) return result.response

    const lead = await db.contactSubmission.findUnique({
      where: { id: params.leadId },
      select: { id: true, email: true },
    })

    if (!lead) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    await enviarEmailRespuestaLead({
      email: lead.email,
      asunto: result.data.asunto,
      mensaje: result.data.mensaje,
    })

    await db.contactSubmission.update({
      where: { id: lead.id },
      data: { leido: true },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error(TAG, "Error al responder al lead", { leadId: params.leadId }, error)
    return NextResponse.json(
      { error: "No se pudo enviar el email. Inténtalo de nuevo." },
      { status: 500 }
    )
  }
}
