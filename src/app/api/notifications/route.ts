import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

// GET: Obtener notificaciones del usuario autenticado
export async function GET(req: Request) {
  try {
    const auth = await requireAuth("notifications:read")
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(req.url)
    const limite = Math.min(parseInt(searchParams.get("limite") || "20"), 50)
    const cursor = searchParams.get("cursor")

    const notificaciones = await db.notification.findMany({
      where: { userId: auth.session.user.id },
      orderBy: { createdAt: "desc" },
      take: limite + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hayMas = notificaciones.length > limite
    if (hayMas) notificaciones.pop()

    // Contar no leidas
    const sinLeer = await db.notification.count({
      where: { userId: auth.session.user.id, read: false },
    })

    return NextResponse.json({
      notificaciones,
      sinLeer,
      siguienteCursor: hayMas ? notificaciones[notificaciones.length - 1]?.id : null,
    })
  } catch (error) {
    logger.error("NOTIFICATIONS_GET", "Error al obtener notificaciones", { ruta: "/api/notifications" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// PATCH: Marcar todas como leidas
export async function PATCH() {
  try {
    const auth = await requireAuth("notifications:update")
    if (isAuthError(auth)) return auth

    await db.notification.updateMany({
      where: { userId: auth.session.user.id, read: false },
      data: { read: true },
    })

    return NextResponse.json({ message: "Todas las notificaciones marcadas como leidas." })
  } catch (error) {
    logger.error("NOTIFICATIONS_MARK_ALL_READ", "Error al marcar todas como leidas", { ruta: "/api/notifications" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
