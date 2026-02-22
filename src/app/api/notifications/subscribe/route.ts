import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import * as z from "zod"

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

// POST: Guardar suscripcion push
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("notifications:read")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const parsed = SubscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de suscripcion invalidos." },
        { status: 400 }
      )
    }

    const { endpoint, keys } = parsed.data

    // Upsert: si el endpoint ya existe, actualizar keys
    await db.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: auth.session.user.id,
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: auth.session.user.id,
      },
    })

    return NextResponse.json({ message: "Suscripcion guardada." }, { status: 201 })
  } catch (error) {
    console.error("[PUSH_SUBSCRIBE_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// DELETE: Eliminar suscripcion push
export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth("notifications:read")
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get("endpoint")

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint requerido." }, { status: 400 })
    }

    await db.pushSubscription.deleteMany({
      where: { endpoint, userId: auth.session.user.id },
    })

    return NextResponse.json({ message: "Suscripcion eliminada." })
  } catch (error) {
    console.error("[PUSH_UNSUBSCRIBE_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
