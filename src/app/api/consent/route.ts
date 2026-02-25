import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import * as z from "zod"

const ConsentSchema = z.object({
  tipo: z.enum(["all", "essential"]),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = ConsentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 })
    }

    // Obtener userId si esta autenticado (opcional)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ?? null

    // Anonimizar IP: reemplazar ultimo octeto
    const forwarded = req.headers.get("x-forwarded-for")
    const ipCompleta = forwarded?.split(",")[0]?.trim() || "unknown"
    const ipAnonimizada = ipCompleta.replace(/\.\d+$/, ".xxx")

    const userAgent = req.headers.get("user-agent")?.substring(0, 256) || null

    await db.cookieConsent.create({
      data: {
        tipo: parsed.data.tipo,
        ip: ipAnonimizada,
        userAgent,
        userId,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[CONSENT_LOG_ERROR]", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
