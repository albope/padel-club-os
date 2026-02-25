import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const inicio = Date.now()

  try {
    // Verificar conexion a la base de datos
    await db.$queryRaw`SELECT 1`
    const dbMs = Date.now() - inicio

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: { status: "connected", responseMs: dbMs },
    })
  } catch (error) {
    console.error("[HEALTH_CHECK_ERROR]", error)

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        db: { status: "disconnected" },
      },
      { status: 503 }
    )
  }
}
