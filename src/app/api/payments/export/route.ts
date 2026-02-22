import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { generarCSV, formatearFechaCSV, formatearHoraCSV } from "@/lib/csv"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth("billing:read")
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

    const pagos = await db.payment.findMany({
      where: {
        clubId,
        createdAt: { gte: desde, lte: hasta },
      },
      include: {
        user: { select: { name: true } },
        booking: {
          select: {
            court: { select: { name: true } },
            startTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const estadoMap: Record<string, string> = {
      succeeded: "Completado",
      pending: "Pendiente",
      failed: "Fallido",
    }

    const tipoMap: Record<string, string> = {
      booking: "Reserva",
      subscription: "Suscripcion",
    }

    const cabeceras = [
      "Fecha",
      "Importe",
      "Moneda",
      "Estado",
      "Tipo",
      "Jugador",
      "Reserva",
    ]

    const filas = pagos.map((p) => {
      const infoReserva = p.booking
        ? `${p.booking.court.name} ${formatearHoraCSV(p.booking.startTime)}`
        : ""

      return [
        formatearFechaCSV(p.createdAt),
        p.amount.toFixed(2),
        p.currency.toUpperCase(),
        estadoMap[p.status] || p.status,
        tipoMap[p.type] || p.type,
        p.user?.name || "",
        infoReserva,
      ]
    })

    const csv = generarCSV(cabeceras, filas)
    const fechaArchivo = formatearFechaCSV(ahora).replace(/\//g, "-")

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pagos-${fechaArchivo}.csv"`,
      },
    })
  } catch (error) {
    console.error("[EXPORT_PAYMENTS_ERROR]", error)
    return new Response("Error interno del servidor", { status: 500 })
  }
}
