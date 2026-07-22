import { NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { registrarAuditoria } from "@/lib/audit"
import { borrarClubDemo } from "@/lib/demo-club"

const TAG = "PLATFORM_DEMO_CLUBS"

export async function DELETE(
  _req: Request,
  { params }: { params: { clubId: string } }
) {
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
