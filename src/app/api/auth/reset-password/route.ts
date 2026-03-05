import { db } from "@/lib/db"
import { verificarTokenRecuperacion, eliminarTokenRecuperacion } from "@/lib/tokens"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { hash } from "bcrypt"
import { NextResponse } from "next/server"
import * as z from "zod"

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token requerido.").max(500),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres.").max(128),
})

const limiter = crearRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 })

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
    const parsed = ResetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    // Verificar token
    const email = await verificarTokenRecuperacion(token)
    if (!email) {
      return NextResponse.json(
        { error: "El enlace ha expirado o no es valido. Solicita uno nuevo." },
        { status: 400 }
      )
    }

    // Buscar usuario
    const usuario = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "No se encontro el usuario asociado." },
        { status: 400 }
      )
    }

    // Actualizar contrasena y desactivar flag de reset obligatorio
    const hashedPassword = await hash(password, 10)
    await db.user.update({
      where: { id: usuario.id },
      data: { password: hashedPassword, mustResetPassword: false },
    })

    // Eliminar token (single-use)
    await eliminarTokenRecuperacion(token)

    return NextResponse.json(
      { message: "Contrasena actualizada correctamente." },
      { status: 200 }
    )
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]", error)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
