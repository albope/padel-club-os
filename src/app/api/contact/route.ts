import { db } from "@/lib/db"
import { enviarEmailContacto } from "@/lib/email"
import { NextResponse } from "next/server"
import * as z from "zod"

const ContactoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Email no valido."),
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
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres."),
})

// Rate limiting en memoria: max 3 envios por IP cada 15 minutos
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW = 15 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

// POST: Enviar formulario de contacto (publico, sin auth)
export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip)) {
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
      console.error("[CONTACT_EMAIL_ERROR]", emailError)
    }

    return NextResponse.json(
      { message: "Mensaje enviado correctamente." },
      { status: 201 }
    )
  } catch (error) {
    console.error("[CONTACT_SUBMIT_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
