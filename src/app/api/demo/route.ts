import { db } from "@/lib/db"
import { enviarEmailSolicitudDemo } from "@/lib/email"
import { logger } from "@/lib/logger"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { NextResponse } from "next/server"
import * as z from "zod"

const SOURCES_VALIDAS = [
  "hero",
  "navbar",
  "cta",
  "pricing",
  "switch-matchpoint",
  "comparativa-matchpoint",
  "contacto",
  "unknown",
] as const

const DemoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  email: z.string().email("Email no valido.").max(255),
  telefono: z.string().max(20).optional(),
  clubNombre: z.string().min(1, "Indica el nombre del club.").max(200),
  numeroPistas: z.number().int().min(1).max(50),
  softwareActual: z.enum(["ninguno", "matchpoint", "playtomic", "doinsport", "otro"]),
  urgencia: z.enum(["urgente", "proximo-mes", "explorando"]),
  mensaje: z.string().max(5000).optional(),
  paginaOrigen: z.string().max(500).optional(),
  source: z.string().max(100).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
})

const limiter = crearRateLimiter({ maxRequests: 5, windowMs: 30 * 60 * 1000, prefix: "rl:demo" })

// POST: Enviar solicitud de demo (publico, sin auth)
export async function POST(req: Request) {
  try {
    const ip = obtenerIP(req)
    if (!(await limiter.verificar(ip))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentalo de nuevo en unos minutos." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = DemoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { nombre, email, telefono, clubNombre, numeroPistas, softwareActual, urgencia, mensaje, paginaOrigen, source, utmSource, utmMedium, utmCampaign } = parsed.data

    // Normalizar source contra enum cerrada
    const sourceNormalizado = source && (SOURCES_VALIDAS as readonly string[]).includes(source)
      ? source
      : "unknown"

    await db.contactSubmission.create({
      data: {
        nombre,
        email,
        asunto: "Solicitud de demo",
        mensaje: mensaje || "",
        tipo: "demo",
        clubNombre,
        numeroPistas,
        softwareActual,
        urgencia,
        paginaOrigen: paginaOrigen || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
      },
    })

    // Enviar email de notificacion (no bloquear si falla)
    try {
      await enviarEmailSolicitudDemo({
        nombre,
        email,
        telefono,
        clubNombre,
        numeroPistas,
        softwareActual,
        urgencia,
        mensaje,
        source: sourceNormalizado,
        paginaOrigen,
        utmSource,
        utmMedium,
        utmCampaign,
      })
    } catch (emailError) {
      logger.error("DEMO_EMAIL", "Error al enviar email de solicitud de demo", { ruta: "/api/demo" }, emailError)
    }

    return NextResponse.json(
      { message: "Solicitud de demo enviada correctamente." },
      { status: 201 }
    )
  } catch (error) {
    logger.error("DEMO_SUBMIT", "Error al procesar solicitud de demo", { ruta: "/api/demo" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
