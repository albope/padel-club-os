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
    if (auth.session.user.role !== "PLAYER") {
      return NextResponse.json(
        { error: "Esta operacion solo esta disponible para jugadores." },
        { status: 403 }
      )
    }

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

    await db.$transaction(async (tx) => {
      const membership = await tx.clubMembership.findUnique({
        where: { userId_clubId: { userId, clubId } },
      })

      if (!membership || membership.status === "REVOKED") {
        throw new Error("MEMBERSHIP_NOT_FOUND")
      }

      // El club conserva los justificantes contables, pero ya no quedan
      // vinculados a la identidad del jugador.
      await tx.booking.updateMany({
        where: { userId, clubId },
        data: { userId: null, guestName: "Usuario eliminado" },
      })
      await tx.bookingPayment.updateMany({
        where: { userId, clubId },
        data: { userId: null, guestName: "Usuario eliminado" },
      })

      await Promise.all([
        tx.notification.deleteMany({ where: { userId, clubId } }),
        tx.playerStats.deleteMany({ where: { userId, clubId } }),
        tx.openMatchPlayer.deleteMany({
          where: { userId, openMatch: { clubId } },
        }),
        tx.playerRating.deleteMany({
          where: { clubId, OR: [{ raterId: userId }, { ratedId: userId }] },
        }),
        tx.chatMessage.deleteMany({ where: { authorId: userId, clubId } }),
        tx.bookingWaitlist.deleteMany({ where: { userId, clubId } }),
      ])

      await tx.clubMembership.update({
        where: { id: membership.id },
        data: { status: "REVOKED" },
      })

      const remainingMembership = await tx.clubMembership.findFirst({
        where: { userId, status: "ACTIVE" },
        orderBy: { joinedAt: "asc" },
      })

      if (remainingMembership) {
        // La identidad es global: si sigue perteneciendo a otro club, solo se
        // revoca esta pertenencia y se cambia el club primario.
        await tx.user.update({
          where: { id: userId },
          data: {
            clubId: remainingMembership.clubId,
            role: remainingMembership.role,
            isActive: true,
            sessionVersion: { increment: 1 },
          },
        })
        return
      }

      // Sin otras pertenencias activas, se cierra la cuenta completa y se
      // conserva un registro anonimizado para la integridad historica.
      await Promise.all([
        tx.pushSubscription.deleteMany({ where: { userId } }),
        tx.session.deleteMany({ where: { userId } }),
        tx.account.deleteMany({ where: { userId } }),
        tx.cookieConsent.updateMany({
          where: { userId },
          data: { userId: null },
        }),
        tx.legalAcceptance.updateMany({
          where: { userId },
          data: { userId: null },
        }),
        ...(usuario.email
          ? [tx.passwordResetToken.deleteMany({ where: { email: usuario.email } })]
          : []),
      ])

      await tx.user.update({
        where: { id: userId },
        data: {
          name: "Usuario eliminado",
          email: `eliminado-${userId}@anonimizado.local`,
          password: null,
          phone: null,
          position: null,
          level: null,
          birthDate: null,
          image: null,
          adminNotes: null,
          clubId: null,
          isActive: false,
          sessionVersion: { increment: 1 },
        },
      })
    })

    return NextResponse.json({
      message:
        "Tus datos personales han sido eliminados. Tu sesion se cerrara automaticamente.",
    })
  } catch (error) {
    if (error instanceof Error && error.message === "MEMBERSHIP_NOT_FOUND") {
      return NextResponse.json(
        { error: "La pertenencia al club ya no esta activa." },
        { status: 409 }
      )
    }
    logger.error("DATA_DELETE", "Error al eliminar datos del jugador", { ruta: "/api/player/data-delete" }, error)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
