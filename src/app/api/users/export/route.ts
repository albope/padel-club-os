import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { generarCSV, formatearFechaCSV } from "@/lib/csv"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const auth = await requireAuth("users:read")
    if (isAuthError(auth)) return auth

    const clubId = auth.session.user.clubId

    const memberships = await db.clubMembership.findMany({
      where: {
        clubId,
        role: "PLAYER",
        status: { not: "REVOKED" },
      },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    })

    const cabeceras = [
      "Nombre",
      "Email",
      "Telefono",
      "Nivel",
      "Posicion",
    ]

    const filas = memberships.map(({ user: s }) => [
      s.name || "",
      s.email || "",
      s.phone || "",
      s.level || "",
      s.position || "",
    ])

    const csv = generarCSV(cabeceras, filas)
    const fechaArchivo = formatearFechaCSV(new Date()).replace(/\//g, "-")

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="socios-${fechaArchivo}.csv"`,
      },
    })
  } catch (error) {
    logger.error("EXPORT_USERS", "Error al exportar socios", { ruta: "/api/users/export" }, error)
    return new Response("Error interno del servidor", { status: 500 })
  }
}
