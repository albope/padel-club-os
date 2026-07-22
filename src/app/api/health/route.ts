import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const inicio = Date.now()

  try {
    // Verificar conexion a la base de datos
    await db.$queryRaw`SELECT 1`
    const dbMs = Date.now() - inicio

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        db: { status: "connected", responseMs: dbMs },
      },
      // El monitor de uptime consulta cada 5 min: la respuesta nunca debe cachearse
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    logger.error("HEALTH", "Error en health check de base de datos", { ruta: "/api/health" }, error)

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        db: { status: "disconnected" },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    )
  }
}
