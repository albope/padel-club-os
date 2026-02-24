import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "./auth"
import { Permission, hasPermission, ADMIN_ROLES } from "./permissions"
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
    }
  }
}

interface RequireAuthOptions {
  /** Si true, verifica que la suscripcion este activa (solo aplica a roles admin) */
  requireSubscription?: boolean
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

  // Verificar suscripcion activa si se solicita (solo para roles admin)
  if (options?.requireSubscription && ADMIN_ROLES.includes(session.user.role as UserRole)) {
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
      },
    },
  }
}

/** Helper para comprobar si el resultado es un error */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
