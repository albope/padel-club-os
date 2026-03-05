import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { crearTokenRecuperacion } from "@/lib/tokens"
import { enviarEmailActivacionCuenta } from "@/lib/email"
import { logger } from "@/lib/logger"

// POST: Reenviar email de activacion a un socio
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await requireAuth("users:update")
    if (isAuthError(auth)) return auth
    const clubId = auth.session.user.clubId

    const { userId } = await params

    // Buscar usuario
    const usuario = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, password: true, mustResetPassword: true, clubId: true },
    })

    if (!usuario || usuario.clubId !== clubId) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 })
    }

    if (!usuario.email) {
      return NextResponse.json({ error: "El usuario no tiene email." }, { status: 400 })
    }

    // Solo reenviar si no tiene password o tiene mustResetPassword
    if (usuario.password && !usuario.mustResetPassword) {
      return NextResponse.json({ error: "El usuario ya tiene su cuenta activada." }, { status: 400 })
    }

    // Obtener datos del club
    const club = await db.club.findUnique({
      where: { id: clubId! },
      select: { name: true, slug: true },
    })

    if (!club?.slug || !club?.name) {
      return NextResponse.json({ error: "El club no tiene slug o nombre configurado." }, { status: 400 })
    }

    // Generar token y enviar email
    const token = await crearTokenRecuperacion(usuario.email)
    await enviarEmailActivacionCuenta({
      email: usuario.email,
      token,
      nombre: usuario.name,
      clubNombre: club.name,
      clubSlug: club.slug,
    })

    // Asegurar que mustResetPassword esta activado
    if (!usuario.mustResetPassword) {
      await db.user.update({
        where: { id: usuario.id },
        data: { mustResetPassword: true },
      })
    }

    logger.info("RESEND_ACTIVATION", "Email de activacion reenviado", { userId, email: usuario.email, clubId })

    return NextResponse.json({ message: "Email de activacion enviado correctamente." })
  } catch (error) {
    logger.error("RESEND_ACTIVATION", "Error reenviando email de activacion", {}, error)
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
