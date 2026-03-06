import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { validarBody } from "@/lib/validation"
import { getSubscriptionInfo, getPlanLimits } from "@/lib/subscription"
import { logger } from "@/lib/logger"
import {
  normalizarNombre,
  dedupPistasCSV,
  dedupPreciosIntraPista,
  type PistaImportada,
  type ImportError,
} from "@/lib/import-courts"
import * as z from "zod"

const PricingRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
  price: z.number().positive("El precio debe ser mayor que 0"),
}).refine(d => d.startHour < d.endHour, { message: "startHour debe ser menor que endHour" })

const PistaImportSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido.").max(100, "El nombre no puede superar 100 caracteres."),
  tipo: z.string().max(50, "El tipo no puede superar 50 caracteres.").optional().default("Cristal"),
  precios: z.array(PricingRuleSchema).optional().default([]),
  fila: z.number().int().min(1),
})

const ImportPistasBodySchema = z.object({
  pistas: z.array(PistaImportSchema).min(1, "Se requiere al menos una pista.").max(100, "Maximo 100 pistas por importacion."),
})

// POST: Importar pistas con pricing en bulk
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("courts:import", { requireSubscription: true })
    if (isAuthError(auth)) return auth
    const clubId = auth.session.user.clubId!

    const body = await req.json()
    const result = validarBody(ImportPistasBodySchema, body)
    if (!result.success) return result.response
    const { pistas } = result.data

    // 1. Dedup intra-CSV (funciones puras)
    const { unicas: pistasUnicas, errors: errorsDedup } = dedupPistasCSV(pistas as PistaImportada[])
    const errors: ImportError[] = [...errorsDedup]

    // 2. Dedup pricing intra-pista
    const pistasConPreciosDedup = pistasUnicas.map(p => ({
      ...p,
      precios: dedupPreciosIntraPista(p.precios),
    }))

    if (pistasConPreciosDedup.length === 0) {
      return NextResponse.json({
        successCount: 0,
        errors,
        courtsCreated: [],
      })
    }

    // Obtener info de suscripcion (fuera de tx para no alargar la transaccion innecesariamente)
    const info = await getSubscriptionInfo(clubId)
    const limits = getPlanLimits(info.tier)

    // 3. Transaccion atomica: dedup contra BD + limites + creacion
    const courtsCreated = await db.$transaction(async (tx) => {
      // Query existentes DENTRO de la transaccion (previene race conditions)
      const existentes = await tx.court.findMany({
        where: { clubId },
        select: { name: true },
      })
      const nombresExistentes = new Set(existentes.map(c => normalizarNombre(c.name)))

      // Filtrar duplicados contra BD
      const pistasNuevas = pistasConPreciosDedup.filter(p => {
        if (nombresExistentes.has(normalizarNombre(p.nombre))) {
          errors.push({
            fila: p.fila,
            campo: "nombre",
            mensaje: `Pista "${p.nombre}" ya existe en el club`,
          })
          return false
        }
        return true
      })

      if (pistasNuevas.length === 0) return []

      // Check limites de plan (despues de dedup, dentro de tx)
      if (limits.courts !== -1 && existentes.length + pistasNuevas.length > limits.courts) {
        throw new Error(
          `PLAN_LIMIT:Tu plan permite ${limits.courts} pistas. Tienes ${existentes.length}, intentas importar ${pistasNuevas.length}.`
        )
      }

      // Crear pistas una a una (necesitamos IDs para pricing)
      const creados: { name: string; type: string; pricingRulesCount: number }[] = []
      for (const pista of pistasNuevas) {
        const court = await tx.court.create({
          data: {
            name: pista.nombre.trim(),
            type: pista.tipo,
            clubId,
          },
        })

        if (pista.precios.length > 0) {
          await tx.courtPricing.createMany({
            data: pista.precios.map(p => ({
              dayOfWeek: p.dayOfWeek,
              startHour: p.startHour,
              endHour: p.endHour,
              price: p.price,
              courtId: court.id,
              clubId,
            })),
          })
        }

        creados.push({
          name: court.name,
          type: court.type,
          pricingRulesCount: pista.precios.length,
        })
      }

      return creados
    })

    logger.info("IMPORT_COURTS", `${courtsCreated.length} pistas importadas`, {
      clubId,
      importadas: courtsCreated.length,
      errores: errors.length,
    })

    return NextResponse.json({
      successCount: courtsCreated.length,
      errors,
      courtsCreated,
    })
  } catch (error: unknown) {
    // Error de limite de plan (lanzado dentro de la transaccion)
    if (error instanceof Error && error.message.startsWith("PLAN_LIMIT:")) {
      return NextResponse.json(
        { error: error.message.replace("PLAN_LIMIT:", "") },
        { status: 403 }
      )
    }

    logger.error("IMPORT_COURTS", "Error en importacion de pistas", { ruta: "/api/courts/import" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
