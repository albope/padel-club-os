import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

const limiter = crearRateLimiter({ maxRequests: 3, windowMs: 60 * 60 * 1000, prefix: "rl:data-export" })

export async function GET(req: Request) {
  try {
    const auth = await requireAuth("profile:export")
    if (isAuthError(auth)) return auth

    const ip = obtenerIP(req)
    if (!(await limiter.verificar(ip))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentalo de nuevo mas tarde." },
        { status: 429 }
      )
    }

    const userId = auth.session.user.id
    const clubId = auth.session.user.clubId

    const [usuario, reservas, partidasAbiertas, estadisticas, equipos, notificaciones, pagos] =
      await Promise.all([
        // 1. Datos personales
        db.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            email: true,
            phone: true,
            position: true,
            level: true,
            birthDate: true,
            image: true,
            role: true,
            isActive: true,
          },
        }),
        // 2. Reservas
        db.booking.findMany({
          where: { userId, clubId },
          select: {
            startTime: true,
            endTime: true,
            totalPrice: true,
            paymentStatus: true,
            status: true,
            cancelledAt: true,
            cancelReason: true,
            court: { select: { name: true, type: true } },
          },
          orderBy: { startTime: "desc" },
        }),
        // 3. Participaciones en partidas abiertas
        db.openMatchPlayer.findMany({
          where: { userId },
          select: {
            createdAt: true,
            openMatch: {
              select: {
                matchTime: true,
                status: true,
                levelMin: true,
                levelMax: true,
                court: { select: { name: true } },
              },
            },
          },
        }),
        // 4. Estadisticas
        db.playerStats.findFirst({
          where: { userId, clubId },
          select: {
            eloRating: true,
            matchesPlayed: true,
            matchesWon: true,
            setsWon: true,
            setsLost: true,
            gamesWon: true,
            gamesLost: true,
            winStreak: true,
            bestWinStreak: true,
          },
        }),
        // 5. Equipos de competicion
        db.team.findMany({
          where: { OR: [{ player1Id: userId }, { player2Id: userId }] },
          select: {
            name: true,
            points: true,
            played: true,
            won: true,
            lost: true,
            competition: { select: { name: true, format: true, status: true } },
          },
        }),
        // 6. Notificaciones (ultimas 500)
        db.notification.findMany({
          where: { userId, clubId },
          select: {
            type: true,
            title: true,
            message: true,
            read: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
        // 7. Pagos
        db.payment.findMany({
          where: { userId, clubId },
          select: {
            amount: true,
            currency: true,
            status: true,
            type: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      ])

    const exportacion = {
      metadatos: {
        fechaExportacion: new Date().toISOString(),
        plataforma: "Padel Club OS",
        formato: "RGPD - Derecho de portabilidad (Articulo 20)",
      },
      datosPersonales: usuario,
      reservas,
      partidasAbiertas: partidasAbiertas.map((p) => ({
        fechaUnion: p.createdAt,
        ...p.openMatch,
      })),
      estadisticas: estadisticas || null,
      competiciones: equipos,
      notificaciones,
      pagos,
    }

    const json = JSON.stringify(exportacion, null, 2)
    const fechaArchivo = new Date().toISOString().slice(0, 10)

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="mis-datos-padel-${fechaArchivo}.json"`,
      },
    })
  } catch (error) {
    logger.error("DATA_EXPORT", "Error al exportar datos del jugador", { ruta: "/api/player/data-export" }, error)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
