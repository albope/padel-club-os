import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "./auth"
import { Permission, hasPermission } from "./permissions"
import { UserRole } from "@prisma/client"
import { isSubscriptionActive } from "./subscription"

interface AuthResult {
  session: {
    user: {
      id: string
      clubId: string
      role: UserRole
      name?: string | null
      email?: string | null
      subscriptionStatus?: string | null
      trialEndsAt?: string | null
      actorId?: string | null
      actorName?: string | null
      impersonationId?: string | null
      impersonationReadOnly?: boolean
    }
  }
}

interface RequireAuthOptions {
  /** Fuerza la comprobacion incluso para permisos de lectura. */
  requireSubscription?: boolean
  /** Solo para operaciones de soporte expresamente auditadas. */
  allowImpersonationWrite?: boolean
}

const SUBSCRIPTION_EXEMPT_PERMISSIONS = new Set<Permission>([
  "billing:read",
  "billing:update",
  "profile:read",
  "profile:export",
  "profile:delete",
  "platform:read",
  "platform:manage",
])

function esPermisoDeEscritura(permission?: Permission): boolean {
  if (!permission) return false
  return !permission.endsWith(":read") && permission !== "profile:export"
}

/**
 * Verifica sesion, clubId y permiso en una sola llamada.
 * Retorna la sesion autenticada o una NextResponse de error.
 *
 * Uso:
 *   const auth = await requireAuth("bookings:create")
 *   if (isAuthError(auth)) return auth
 *   const { session } = auth
 *
 * Con verificacion de suscripcion:
 *   const auth = await requireAuth("courts:create", { requireSubscription: true })
 *   if (isAuthError(auth)) return auth
 */
export async function requireAuth(
  permission?: Permission,
  options?: RequireAuthOptions
): Promise<AuthResult | NextResponse> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    )
  }

  if (session.user.authInvalid) {
    return NextResponse.json(
      {
        error: "Sesion invalidada",
        code: "SESSION_INVALIDATED",
        message: "Tu sesion ha cambiado o ha sido revocada. Inicia sesion de nuevo.",
      },
      { status: 401 },
    )
  }

  if (!session.user.clubId) {
    return NextResponse.json(
      { error: "Usuario sin club asignado" },
      { status: 403 }
    )
  }

  if (permission && !hasPermission(session.user.role as UserRole, permission)) {
    return NextResponse.json(
      { error: "Sin permisos para esta accion" },
      { status: 403 }
    )
  }

  const escritura = esPermisoDeEscritura(permission)

  if (
    session.user.impersonationId
    && session.user.impersonationReadOnly
    && escritura
    && !options?.allowImpersonationWrite
  ) {
    return NextResponse.json(
      {
        error: "Impersonacion en modo solo lectura",
        code: "IMPERSONATION_READ_ONLY",
      },
      { status: 403 },
    )
  }

  // Toda mutacion de negocio exige suscripcion activa, tambien para jugadores.
  // Facturacion, exportacion/borrado de datos y soporte de plataforma quedan
  // disponibles para poder recuperar o cerrar una cuenta.
  const verificarSuscripcion = (
    options?.requireSubscription
    || (
      escritura
      && permission
      && !SUBSCRIPTION_EXEMPT_PERMISSIONS.has(permission)
    )
  )

  if (
    verificarSuscripcion
    && session.user.role !== UserRole.SUPER_ADMIN
  ) {
    const status = session.user.subscriptionStatus ?? "trialing"
    const trialEndsAt = session.user.trialEndsAt ? new Date(session.user.trialEndsAt) : null
    const activa = isSubscriptionActive(status, trialEndsAt)

    if (!activa) {
      return NextResponse.json(
        {
          error: "Suscripcion inactiva",
          code: "SUBSCRIPTION_INACTIVE",
          message: "Tu suscripcion ha expirado o fue cancelada. Actualiza tu plan en Facturacion para continuar.",
        },
        { status: 403 }
      )
    }
  }

  // Contexto de usuario en Sentry para todas las API routes autenticadas
  import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.setUser({ id: session.user.id })
      Sentry.setTag("clubId", session.user.clubId)
      Sentry.setTag("role", session.user.role as string)
      if (session.user.actorId) {
        Sentry.setTag("impersonatedBy", session.user.actorId)
      }
    })
    .catch(() => {})

  return {
    session: {
      user: {
        id: session.user.id,
        clubId: session.user.clubId,
        role: session.user.role as UserRole,
        name: session.user.name,
        email: session.user.email,
        subscriptionStatus: session.user.subscriptionStatus,
        trialEndsAt: session.user.trialEndsAt,
        actorId: session.user.actorId,
        actorName: session.user.actorName,
        impersonationId: session.user.impersonationId,
        impersonationReadOnly: session.user.impersonationReadOnly,
      },
    },
  }
}

/** Helper para comprobar si el resultado es un error */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
