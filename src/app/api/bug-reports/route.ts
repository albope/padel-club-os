import { db } from "@/lib/db"
import { isAuthError, requireAuth } from "@/lib/api-auth"
import { crearRateLimiter } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import * as z from "zod"

const ReportSchema = z.object({
  category: z.enum(["BUG", "UX", "PERFORMANCE", "DATA", "SUGGESTION", "OTHER"]),
  description: z.string().trim().min(10).max(4000),
  pageUrl: z.string().max(1000).optional(),
  viewport: z.string().regex(/^\d{2,5}x\d{2,5}$/).optional(),
  metadata: z.record(z.unknown()).optional(),
})
const limiter = crearRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
  prefix: "rl:bug-reports",
})

export async function POST(req: Request) {
  try {
    const auth = await requireAuth()
    if (isAuthError(auth)) return auth
    if (!(await limiter.verificar(auth.session.user.id))) {
      return NextResponse.json(
        { error: "Has enviado varios reportes. Espera un poco antes de enviar otro." },
        { status: 429 },
      )
    }

    const parsed = ReportSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Reporte no valido." },
        { status: 400 },
      )
    }

    const descripcion = parsed.data.description
    const title = descripcion.replace(/\s+/g, " ").slice(0, 157)
    let pageUrl: string | null = null
    if (parsed.data.pageUrl) {
      try {
        pageUrl = new URL(parsed.data.pageUrl, "https://padelclubos.invalid").pathname.slice(0, 1000)
      } catch {
        pageUrl = null
      }
    }
    const metadata = {
      locale:
        typeof parsed.data.metadata?.locale === "string"
          ? parsed.data.metadata.locale.slice(0, 20)
          : undefined,
      role: auth.session.user.role,
      impersonationId: auth.session.user.impersonationId || undefined,
    }

    const report = await db.bugReport.create({
      data: {
        category: parsed.data.category,
        title,
        description: descripcion,
        pageUrl,
        viewport: parsed.data.viewport,
        userAgent: req.headers.get("user-agent")?.slice(0, 1000) || null,
        metadata,
        userId: auth.session.user.id,
        clubId: auth.session.user.clubId,
      },
      select: { id: true, status: true, createdAt: true },
    })

    import("@sentry/nextjs")
      .then((Sentry) => {
        Sentry.withScope((scope) => {
          scope.setTag("userFeedback", "true")
          scope.setTag("bugReportId", report.id)
          scope.setTag("clubId", auth.session.user.clubId)
          scope.setLevel("info")
          Sentry.captureMessage(`Feedback de usuario: ${parsed.data.category}`)
        })
      })
      .catch(() => {})

    return NextResponse.json(
      { ...report, message: "Gracias. Hemos recibido el reporte." },
      { status: 201 },
    )
  } catch (error) {
    logger.error("BUG_REPORT_CREATE", "Error creando reporte", {}, error)
    return NextResponse.json({ error: "No se pudo enviar el reporte." }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuth("platform:read")
    if (isAuthError(auth)) return auth
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const reports = await db.bugReport.findMany({
      where: {
        ...(status && ["NEW", "TRIAGED", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)
          ? { status: status as "NEW" | "TRIAGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" }
          : {}),
      },
      include: {
        user: { select: { name: true, email: true, role: true } },
        club: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    })
    return NextResponse.json(reports)
  } catch (error) {
    logger.error("BUG_REPORT_LIST", "Error listando reportes", {}, error)
    return NextResponse.json({ error: "No se pudieron cargar los reportes." }, { status: 500 })
  }
}
