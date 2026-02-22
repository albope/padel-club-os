import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { generarCSV, formatearFechaCSV } from "@/lib/csv"

export async function GET() {
  try {
    const auth = await requireAuth("users:read")
    if (isAuthError(auth)) return auth

    const clubId = auth.session.user.clubId

    const socios = await db.user.findMany({
      where: {
        clubId,
        role: "PLAYER",
      },
      orderBy: { name: "asc" },
    })

    const cabeceras = [
      "Nombre",
      "Email",
      "Telefono",
      "Nivel",
      "Posicion",
    ]

    const filas = socios.map((s) => [
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
    console.error("[EXPORT_USERS_ERROR]", error)
    return new Response("Error interno del servidor", { status: 500 })
  }
}
