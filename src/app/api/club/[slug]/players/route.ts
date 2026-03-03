import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { eloANivel } from "@/lib/elo"
import { logger } from "@/lib/logger"

// GET: Directorio de jugadores del club (requiere auth + mismo club)
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await requireAuth("players:read")
    if (isAuthError(auth)) return auth

    const club = await db.club.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    })

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado." }, { status: 404 })
    }

    // Solo miembros del mismo club pueden ver el directorio
    if (auth.session.user.clubId !== club.id) {
      return NextResponse.json({ error: "Sin acceso a este club." }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""
    const nivel = searchParams.get("nivel") || ""
    const posicion = searchParams.get("posicion") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)))

    // Construir filtro de nivel (busca en User.level como string, ej "3.5")
    const nivelFilter = nivel ? { level: nivel } : {}
    const posicionFilter = posicion ? { position: posicion } : {}
    const nameFilter = q ? { name: { contains: q, mode: "insensitive" as const } } : {}

    const where = {
      clubId: club.id,
      role: "PLAYER" as const,
      isActive: true,
      ...nameFilter,
      ...nivelFilter,
      ...posicionFilter,
    }

    const [jugadores, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          image: true,
          level: true,
          position: true,
          playerStats: {
            where: { clubId: club.id },
            select: {
              eloRating: true,
              matchesPlayed: true,
              matchesWon: true,
              averageRating: true,
              totalRatings: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    const response = jugadores.map((j) => {
      const stats = j.playerStats[0]
      return {
        id: j.id,
        nombre: j.name || "Sin nombre",
        imagen: j.image,
        nivel: j.level,
        posicion: j.position,
        nivelPadel: stats && stats.matchesPlayed > 0 ? eloANivel(stats.eloRating) : null,
        partidosJugados: stats?.matchesPlayed || 0,
        porcentajeVictorias: stats && stats.matchesPlayed > 0
          ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100)
          : 0,
        mediaEstrellas: stats?.averageRating || null,
        totalValoraciones: stats?.totalRatings || 0,
      }
    })

    return NextResponse.json({
      jugadores: response,
      total,
      pagina: page,
      totalPaginas: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    logger.error("GET_CLUB_PLAYERS", "Error al obtener directorio de jugadores", { slug: params.slug }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
