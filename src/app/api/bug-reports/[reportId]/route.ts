import { db } from "@/lib/db"
import { isAuthError, requireAuth } from "@/lib/api-auth"
import { registrarAuditoria } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import * as z from "zod"

const UpdateSchema = z.object({
  status: z.enum(["NEW", "TRIAGED", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
})

export async function PATCH(req: Request, props: { params: Promise<{ reportId: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAuth("platform:manage")
    if (isAuthError(auth)) return auth
    const parsed = UpdateSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Estado no valido." }, { status: 400 })
    }

    const existente = await db.bugReport.findUnique({
      where: { id: params.reportId },
      select: { id: true, clubId: true },
    })
    if (!existente) {
      return NextResponse.json({ error: "Reporte no encontrado." }, { status: 404 })
    }

    const report = await db.bugReport.update({
      where: { id: params.reportId },
      data: {
        status: parsed.data.status,
        resolvedAt:
          parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED"
            ? new Date()
            : null,
      },
    })
    registrarAuditoria({
      recurso: "bug-report",
      accion: "actualizar",
      entidadId: report.id,
      detalles: { status: report.status },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: existente.clubId,
    })
    return NextResponse.json(report)
  } catch (error) {
    logger.error("BUG_REPORT_UPDATE", "Error actualizando reporte", {}, error)
    return NextResponse.json({ error: "No se pudo actualizar el reporte." }, { status: 500 })
  }
}
