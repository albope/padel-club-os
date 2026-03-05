import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

// PATCH: Marcar una notificacion como leida
export async function PATCH(
  req: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    const auth = await requireAuth("notifications:update")
    if (isAuthError(auth)) return auth

    const notificacion = await db.notification.findFirst({
      where: {
        id: params.notificationId,
        userId: auth.session.user.id,
      },
    })

    if (!notificacion) {
      return NextResponse.json({ error: "Notificacion no encontrada." }, { status: 404 })
    }

    await db.notification.update({
      where: { id: params.notificationId },
      data: { read: true },
    })

    return NextResponse.json({ message: "Notificacion marcada como leida." })
  } catch (error) {
    logger.error("NOTIFICATION_MARK_READ", "Error al marcar notificacion como leida", { ruta: "/api/notifications/[notificationId]" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// DELETE: Eliminar una notificacion
export async function DELETE(
  req: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    const auth = await requireAuth("notifications:update")
    if (isAuthError(auth)) return auth

    const notificacion = await db.notification.findFirst({
      where: {
        id: params.notificationId,
        userId: auth.session.user.id,
      },
    })

    if (!notificacion) {
      return NextResponse.json({ error: "Notificacion no encontrada." }, { status: 404 })
    }

    await db.notification.delete({ where: { id: params.notificationId } })

    return NextResponse.json({ message: "Notificacion eliminada." })
  } catch (error) {
    logger.error("NOTIFICATION_DELETE", "Error al eliminar notificacion", { ruta: "/api/notifications/[notificationId]" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
