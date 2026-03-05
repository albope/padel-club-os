import { requireAuth, isAuthError } from "@/lib/api-auth"
import { obtenerVapidPublicKey } from "@/lib/web-push"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

// GET: Obtener la clave publica VAPID para suscripciones push
export async function GET() {
  try {
    const auth = await requireAuth("notifications:read")
    if (isAuthError(auth)) return auth

    const publicKey = obtenerVapidPublicKey()
    return NextResponse.json({ publicKey })
  } catch (error) {
    logger.error("VAPID_KEY", "Error al obtener clave VAPID", { ruta: "/api/notifications/vapid-key" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
