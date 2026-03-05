import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { generarCSV, formatearFechaCSV, formatearHoraCSV } from "@/lib/csv"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth("bookings:read")
    if (isAuthError(auth)) return auth

    const clubId = auth.session.user.clubId
    const { searchParams } = new URL(request.url)

    const ahora = new Date()
    const hace90Dias = new Date(ahora)
    hace90Dias.setDate(hace90Dias.getDate() - 90)

    const desde = searchParams.get("desde")
      ? new Date(searchParams.get("desde")! + "T00:00:00")
      : hace90Dias
    const hasta = searchParams.get("hasta")
      ? new Date(searchParams.get("hasta")! + "T23:59:59")
      : ahora

    const reservas = await db.booking.findMany({
      where: {
        clubId,
        startTime: { gte: desde, lte: hasta },
      },
      include: {
        court: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { startTime: "desc" },
    })

    const estadoMap: Record<string, string> = {
      confirmed: "Confirmada",
      cancelled: "Cancelada",
      pending: "Pendiente",
    }

    const pagoMap: Record<string, string> = {
      paid: "Pagado",
      pending: "Pendiente",
      exempt: "Exento",
      refunded: "Reembolsado",
    }

    const cabeceras = [
      "Fecha",
      "Hora Inicio",
      "Hora Fin",
      "Pista",
      "Jugador",
      "Estado",
      "Precio",
      "Estado Pago",
    ]

    const filas = reservas.map((r) => [
      formatearFechaCSV(r.startTime),
      formatearHoraCSV(r.startTime),
      formatearHoraCSV(r.endTime),
      r.court.name,
      r.user?.name || r.guestName || "Invitado",
      estadoMap[r.status] || r.status,
      r.totalPrice != null ? r.totalPrice.toFixed(2) : "0.00",
      pagoMap[r.paymentStatus || "pending"] || r.paymentStatus || "",
    ])

    const csv = generarCSV(cabeceras, filas)
    const fechaArchivo = formatearFechaCSV(ahora).replace(/\//g, "-")

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservas-${fechaArchivo}.csv"`,
      },
    })
  } catch (error) {
    console.error("[EXPORT_BOOKINGS_ERROR]", error)
    return new Response("Error interno del servidor", { status: 500 })
  }
}
