import { db } from "@/lib/db"
import { crearTokenRecuperacion } from "@/lib/tokens"
import { enviarEmailResetPassword } from "@/lib/email"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { NextResponse } from "next/server"
import * as z from "zod"

const ForgotPasswordSchema = z.object({
  email: z.string().email("Email no valido.").max(255),
  redirectUrl: z.string().max(500).optional(),
})

const limiter = crearRateLimiter({ maxRequests: 3, windowMs: 15 * 60 * 1000 })

export async function POST(req: Request) {
  try {
    const ip = obtenerIP(req)

    if (!limiter.verificar(ip)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentalo de nuevo en unos minutos." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = ForgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, redirectUrl } = parsed.data

    // SEGURIDAD: siempre responder con exito, incluso si el email no existe
    const mensaje =
      "Si el email esta registrado, recibiras instrucciones para restablecer tu contrasena."

    // Buscar usuario
    const usuario = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true, password: true },
    })

    // Solo enviar email si el usuario existe Y tiene contrasena (Credentials)
    if (usuario?.email && usuario.password) {
      try {
        const token = await crearTokenRecuperacion(usuario.email)
        await enviarEmailResetPassword({
          email: usuario.email,
          token,
          nombre: usuario.name,
          redirectUrl,
        })
      } catch (emailError) {
        console.error("[FORGOT_PASSWORD_EMAIL_ERROR]", emailError)
        // No revelar el error al usuario
      }
    }

    return NextResponse.json({ message: mensaje }, { status: 200 })
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]", error)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
