import { db } from "@/lib/db"
import { enviarEmailContacto } from "@/lib/email"
import { logger } from "@/lib/logger"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { NextResponse } from "next/server"
import * as z from "zod"

const ContactoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  email: z.string().email("Email no valido.").max(255),
  asunto: z.enum(
    [
      "Informacion general",
      "Quiero una demo",
      "Soporte tecnico",
      "Colaboracion / Partnership",
      "Otro",
    ],
    { errorMap: () => ({ message: "Selecciona un asunto valido." }) }
  ),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres.").max(5000),
})

const limiter = crearRateLimiter({ maxRequests: 3, windowMs: 15 * 60 * 1000, prefix: "rl:contact" })

// POST: Enviar formulario de contacto (publico, sin auth)
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
    const parsed = ContactoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { nombre, email, asunto, mensaje } = parsed.data

    // Guardar en base de datos
    await db.contactSubmission.create({
      data: { nombre, email, asunto, mensaje },
    })

    // Enviar email de notificacion (no bloquear si falla)
    try {
      await enviarEmailContacto({ nombre, email, asunto, mensaje })
    } catch (emailError) {
      logger.error("CONTACT_EMAIL", "Error al enviar email de contacto", { ruta: "/api/contact" }, emailError)
    }

    return NextResponse.json(
      { message: "Mensaje enviado correctamente." },
      { status: 201 }
    )
  } catch (error) {
    logger.error("CONTACT_SUBMIT", "Error al procesar formulario de contacto", { ruta: "/api/contact" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
