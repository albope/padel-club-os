import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { resolverSegmento } from "@/lib/broadcast"
import { NextResponse } from "next/server"

// GET: Preview de destinatarios para un segmento
export async function GET(req: Request) {
  try {
    const auth = await requireAuth("broadcast:read")
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(req.url)
    const segmento = searchParams.get("segmento") || "all"

    const where = resolverSegmento(segmento, auth.session.user.clubId)
    const count = await db.user.count({ where })

    return NextResponse.json({ count })
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
