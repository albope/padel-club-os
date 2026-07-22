import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { validarBody } from "@/lib/validation"
import { registrarAuditoria } from "@/lib/audit"
import { crearClubDemo, slugifyClub } from "@/lib/demo-club"

const TAG = "PLATFORM_DEMO_CLUBS"

// El seed hace varias decenas de queries: ampliar el limite del serverless
export const maxDuration = 60

const postSchema = z.object({
  clubName: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug invalido (solo letras, numeros y guiones)")
    .min(3)
    .max(60)
    .optional(),
  numCourts: z.number().int().min(1).max(8).optional(),
  numPlayers: z.number().int().min(4).max(12).optional(),
})

export async function POST(req: Request) {
  try {
    const auth = await requireAuth("platform:manage")
    if (isAuthError(auth)) return auth

    const body = await req.json()
    const result = validarBody(postSchema, body)
    if (!result.success) return result.response

    const slug = result.data.slug || slugifyClub(result.data.clubName)
    if (!slug) {
      return NextResponse.json({ error: "Nombre de club invalido" }, { status: 400 })
    }

    let demo
    try {
      demo = await crearClubDemo(db, {
        clubName: result.data.clubName,
        slug,
        numCourts: result.data.numCourts,
        numPlayers: result.data.numPlayers,
      })
    } catch (e) {
      if (e instanceof Error && e.message === "SLUG_EXISTE") {
        return NextResponse.json(
          { error: `Ya existe un club con el slug "${slug}". Elige otro nombre o slug.` },
          { status: 409 }
        )
      }
      throw e
    }

    registrarAuditoria({
      recurso: "club",
      accion: "crear",
      entidadId: demo.clubId,
      detalles: { backoffice: true, demo: true, slug: demo.slug },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: demo.clubId,
      clubName: demo.clubName,
    })

    logger.info(TAG, `Club demo creado: ${demo.slug}`)

    return NextResponse.json(demo, { status: 201 })
  } catch (error) {
    logger.error(TAG, "Error al crear club demo", {}, error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
