import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { registrarAuditoria } from "@/lib/audit"
import { borrarClubDemo, crearClubDemo } from "@/lib/demo-club"

const TAG = "PLATFORM_DEMO_CLUBS"

export async function DELETE(_req: Request, props: { params: Promise<{ clubId: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAuth("platform:manage")
    if (isAuthError(auth)) return auth

    const club = await db.club.findUnique({
      where: { id: params.clubId },
      select: { id: true, name: true, slug: true, esDemo: true },
    })
    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 })
    }
    if (!club.esDemo) {
      return NextResponse.json(
        { error: "Este club no es un club demo. Solo los clubes demo pueden eliminarse desde aqui." },
        { status: 403 }
      )
    }

    const { usuariosBorrados } = await borrarClubDemo(db, club.slug)

    registrarAuditoria({
      recurso: "club",
      accion: "eliminar",
      entidadId: club.id,
      detalles: { backoffice: true, demo: true, slug: club.slug, usuariosBorrados },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: club.id,
      clubName: club.name,
    })

    logger.info(TAG, `Club demo eliminado: ${club.slug} (${usuariosBorrados} usuarios)`)

    return NextResponse.json({ ok: true, usuariosBorrados })
  } catch (error) {
    logger.error(TAG, "Error al eliminar club demo", { clubId: params.clubId }, error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(_req: Request, props: { params: Promise<{ clubId: string }> }) {
  const params = await props.params
  try {
    const auth = await requireAuth("platform:manage")
    if (isAuthError(auth)) return auth

    const club = await db.club.findUnique({
      where: { id: params.clubId },
      select: {
        id: true,
        name: true,
        slug: true,
        esDemo: true,
        _count: {
          select: {
            courts: true,
            memberships: { where: { role: "PLAYER", status: "ACTIVE" } },
          },
        },
      },
    })
    if (!club) return NextResponse.json({ error: "Club no encontrado" }, { status: 404 })
    if (!club.esDemo) {
      return NextResponse.json(
        { error: "Solo se pueden restaurar clubes marcados como demo." },
        { status: 403 },
      )
    }

    const { usuariosBorrados } = await borrarClubDemo(db, club.slug)
    const demo = await crearClubDemo(db, {
      clubName: club.name,
      slug: club.slug,
      numCourts: Math.min(8, Math.max(1, club._count.courts)),
      numPlayers: Math.min(12, Math.max(4, club._count.memberships)),
    })

    registrarAuditoria({
      recurso: "club",
      accion: "actualizar",
      entidadId: demo.clubId,
      detalles: {
        backoffice: true,
        demo: true,
        reset: true,
        slug: demo.slug,
        clubAnteriorId: club.id,
        usuariosBorrados,
      },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: demo.clubId,
      clubName: demo.clubName,
    })

    logger.info(TAG, `Club demo restaurado: ${demo.slug}`)
    return NextResponse.json(demo)
  } catch (error) {
    logger.error(TAG, "Error al restaurar club demo", { clubId: params.clubId }, error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
