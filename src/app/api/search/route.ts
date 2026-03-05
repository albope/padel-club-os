import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const auth = await requireAuth("bookings:read")
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ resultados: [] })
    }

    const clubId = auth.session.user.clubId

    const [socios, pistas, reservas] = await Promise.all([
      // Socios
      db.user.findMany({
        where: {
          clubId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, email: true, role: true },
        take: 5,
      }),
      // Pistas
      db.court.findMany({
        where: {
          clubId,
          name: { contains: query, mode: 'insensitive' },
        },
        select: { id: true, name: true, type: true },
        take: 3,
      }),
      // Reservas futuras
      db.booking.findMany({
        where: {
          clubId,
          startTime: { gte: new Date() },
          OR: [
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { guestName: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          startTime: true,
          court: { select: { name: true } },
          user: { select: { name: true } },
          guestName: true,
        },
        take: 5,
        orderBy: { startTime: 'asc' },
      }),
    ])

    const resultados = [
      ...socios.map(s => ({
        tipo: 'socio' as const,
        id: s.id,
        titulo: s.name || s.email || 'Sin nombre',
        subtitulo: s.email,
        url: `/dashboard/socios`,
      })),
      ...pistas.map(p => ({
        tipo: 'pista' as const,
        id: p.id,
        titulo: p.name,
        subtitulo: p.type,
        url: `/dashboard/pistas`,
      })),
      ...reservas.map(r => ({
        tipo: 'reserva' as const,
        id: r.id,
        titulo: `${r.court.name} - ${r.user?.name || r.guestName || 'Invitado'}`,
        subtitulo: new Date(r.startTime).toLocaleString('es-ES', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
        url: `/dashboard/reservas`,
      })),
    ]

    return NextResponse.json({ resultados })
  } catch (error) {
    logger.error("SEARCH", "Error en busqueda global", { ruta: "/api/search" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
