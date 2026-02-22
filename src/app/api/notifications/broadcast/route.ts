import { requireAuth, isAuthError } from "@/lib/api-auth"
import { notificarClub } from "@/lib/notifications"
import { NextResponse } from "next/server"
import * as z from "zod"

const BroadcastSchema = z.object({
  titulo: z.string().min(1, "El titulo es requerido").max(100, "Maximo 100 caracteres"),
  mensaje: z.string().min(1, "El mensaje es requerido").max(500, "Maximo 500 caracteres"),
})

// POST: Enviar comunicacion masiva a todos los jugadores del club
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("notifications:update")
    if (isAuthError(auth)) return auth

    // Solo admins pueden enviar comunicaciones masivas
    if (!["SUPER_ADMIN", "CLUB_ADMIN"].includes(auth.session.user.role)) {
      return NextResponse.json(
        { error: "Solo administradores pueden enviar comunicaciones masivas" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = BroadcastSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { titulo, mensaje } = parsed.data

    await notificarClub({
      tipo: "club_announcement",
      titulo,
      mensaje,
      clubId: auth.session.user.clubId,
    })

    return NextResponse.json({ message: "Comunicacion enviada correctamente." })
  } catch (error) {
    console.error("[BROADCAST_NOTIFICATION_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
