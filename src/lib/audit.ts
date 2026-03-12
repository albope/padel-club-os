import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { Prisma } from "@prisma/client"

// --- Tipos estrictos ---

export type RecursoAuditoria =
  | "booking"
  | "court"
  | "user"
  | "club"
  | "recurring-booking"
  | "broadcast"

export type AccionAuditoria =
  | "crear"
  | "cancelar"
  | "actualizar"
  | "eliminar"
  | "importar"
  | "enviar"

export type OrigenAuditoria = "usuario" | "sistema" | "cron"

// Valores para filtros de UI e i18n
export const RECURSOS_AUDITORIA: RecursoAuditoria[] = [
  "booking", "court", "user", "club", "recurring-booking", "broadcast",
]

export const ACCIONES_AUDITORIA: AccionAuditoria[] = [
  "crear", "cancelar", "actualizar", "eliminar", "importar", "enviar",
]

// --- Interface ---

interface RegistroAuditoria {
  recurso: RecursoAuditoria
  accion: AccionAuditoria
  entidadId?: string
  detalles?: Record<string, unknown>
  userId?: string | null
  userName?: string | null
  origen?: OrigenAuditoria
  clubId: string
  clubName?: string | null
}

/**
 * Registra una accion en el log de auditoria.
 * Fire-and-forget: nunca bloquea ni lanza errores.
 */
export function registrarAuditoria(datos: RegistroAuditoria): void {
  try {
    db.auditLog
      .create({
        data: {
          recurso: datos.recurso,
          accion: datos.accion,
          entidadId: datos.entidadId,
          detalles: (datos.detalles ?? undefined) as Prisma.InputJsonValue | undefined,
          userId: datos.userId ?? undefined,
          userName: datos.userName ?? undefined,
          origen: datos.origen ?? "usuario",
          clubId: datos.clubId,
          clubName: datos.clubName ?? undefined,
        },
      })
      .catch((error) => {
        logger.warn("AUDIT", "Error al registrar auditoria", {
          recurso: datos.recurso,
          accion: datos.accion,
          userId: datos.userId ?? undefined,
          clubId: datos.clubId,
        }, error)
      })
  } catch {
    // db.auditLog puede no existir en entornos de test con mocks parciales
  }
}
