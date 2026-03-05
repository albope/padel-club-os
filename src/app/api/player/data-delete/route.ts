import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import * as z from "zod"
import bcrypt from "bcrypt"

const limiter = crearRateLimiter({ maxRequests: 1, windowMs: 60 * 60 * 1000, prefix: "rl:data-delete" })

const DeleteSchema = z.object({
  contrasena: z.string().min(1, "Contrasena requerida."),
  confirmacion: z.literal("ELIMINAR MIS DATOS"),
})

export async function POST(req: Request) {
  try {
    const auth = await requireAuth("profile:delete")
    if (isAuthError(auth)) return auth

    const ip = obtenerIP(req)
    if (!(await limiter.verificar(ip))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentalo mas tarde." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = DeleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const userId = auth.session.user.id
    const clubId = auth.session.user.clubId

    // Verificar contrasena
    const usuario = await db.user.findUnique({
      where: { id: userId },
      select: { password: true, email: true },
    })

    if (!usuario?.password) {
      return NextResponse.json(
        { error: "No se puede verificar la identidad." },
        { status: 400 }
      )
    }

    const contrasenaValida = await bcrypt.compare(
      parsed.data.contrasena,
      usuario.password
    )
    if (!contrasenaValida) {
      return NextResponse.json(
        { error: "Contrasena incorrecta." },
        { status: 401 }
      )
    }

    // Ejecutar anonimizacion en transaccion
    const emailAnonimizado = `eliminado-${userId.slice(0, 8)}@anonimizado.local`

    await db.$transaction([
      // 1. Desvincular reservas (el club las conserva para contabilidad)
      db.booking.updateMany({
        where: { userId, clubId },
        data: { userId: null },
      }),
      // 2. Eliminar suscripciones push
      db.pushSubscription.deleteMany({ where: { userId } }),
      // 3. Eliminar notificaciones
      db.notification.deleteMany({ where: { userId } }),
      // 4. Eliminar estadisticas
      db.playerStats.deleteMany({ where: { userId, clubId } }),
      // 5. Eliminar participaciones en partidas abiertas
      db.openMatchPlayer.deleteMany({ where: { userId } }),
      // 6. Eliminar tokens de recuperacion
      ...(usuario.email
        ? [db.passwordResetToken.deleteMany({ where: { email: usuario.email } })]
        : []),
      // 7. Invalidar sesiones
      db.session.deleteMany({ where: { userId } }),
      // 8. Eliminar cuentas NextAuth
      db.account.deleteMany({ where: { userId } }),
      // 9. Anonimizar usuario (mantener registro para integridad de equipos/competiciones)
      db.user.update({
        where: { id: userId },
        data: {
          name: "Usuario eliminado",
          email: emailAnonimizado,
          password: null,
          phone: null,
          position: null,
          level: null,
          birthDate: null,
          image: null,
          adminNotes: null,
          isActive: false,
        },
      }),
    ])

    return NextResponse.json({
      message:
        "Tus datos personales han sido eliminados. Tu sesion se cerrara automaticamente.",
    })
  } catch (error) {
    logger.error("DATA_DELETE", "Error al eliminar datos del jugador", { ruta: "/api/player/data-delete" }, error)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
