import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { Prisma } from "@prisma/client"

const TAG = "AUDIT_LOG"

export async function GET(req: Request) {
  try {
    const auth = await requireAuth("audit:read")
    if (isAuthError(auth)) return auth

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50")))
    const recurso = url.searchParams.get("recurso")
    const accion = url.searchParams.get("accion")
    const desde = url.searchParams.get("desde")
    const hasta = url.searchParams.get("hasta")

    const where: Prisma.AuditLogWhereInput = {
      clubId: auth.session.user.clubId,
      ...(recurso && { recurso }),
      ...(accion && { accion }),
      ...((desde || hasta) ? {
        createdAt: {
          ...(desde && { gte: new Date(desde) }),
          ...(hasta && { lte: new Date(hasta + "T23:59:59.999Z") }),
        },
      } : {}),
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, limit })
  } catch (error) {
    logger.error(TAG, "Error al obtener audit logs", {}, error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
