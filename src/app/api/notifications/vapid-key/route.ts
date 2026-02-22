import { requireAuth, isAuthError } from "@/lib/api-auth"
import { obtenerVapidPublicKey } from "@/lib/web-push"
import { NextResponse } from "next/server"

// GET: Obtener la clave publica VAPID para suscripciones push
export async function GET() {
  try {
    const auth = await requireAuth("notifications:read")
    if (isAuthError(auth)) return auth

    const publicKey = obtenerVapidPublicKey()
    return NextResponse.json({ publicKey })
  } catch (error) {
    console.error("[VAPID_KEY_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
