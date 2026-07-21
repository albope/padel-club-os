import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { Prisma } from "@prisma/client"

const TAG = "LEADS"

export async function GET(req: Request) {
  try {
    const auth = await requireAuth("leads:read")
    if (isAuthError(auth)) return auth

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50")))
    const tipo = url.searchParams.get("tipo")
    const soloNoLeidos = url.searchParams.get("noLeidos") === "true"

    const where: Prisma.ContactSubmissionWhereInput = {
      ...(tipo && { tipo }),
      ...(soloNoLeidos && { leido: false }),
    }

    const [leads, total, noLeidos] = await Promise.all([
      db.contactSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contactSubmission.count({ where }),
      db.contactSubmission.count({ where: { leido: false } }),
    ])

    return NextResponse.json({ leads, total, noLeidos, page, limit })
  } catch (error) {
    logger.error(TAG, "Error al obtener leads", {}, error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
