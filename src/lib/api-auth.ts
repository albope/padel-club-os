import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "./auth"
import { Permission, hasPermission } from "./permissions"
import { UserRole } from "@prisma/client"

interface AuthResult {
  session: {
    user: {
      id: string
      clubId: string
      role: UserRole
      name?: string | null
      email?: string | null
    }
  }
}

/**
 * Verifica sesion, clubId y permiso en una sola llamada.
 * Retorna la sesion autenticada o una NextResponse de error.
 *
 * Uso:
 *   const auth = await requireAuth("bookings:create")
 *   if (auth instanceof NextResponse) return auth
 *   const { session } = auth
 */
export async function requireAuth(
  permission?: Permission
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

  return {
    session: {
      user: {
        id: session.user.id,
        clubId: session.user.clubId,
        role: session.user.role as UserRole,
        name: session.user.name,
        email: session.user.email,
      },
    },
  }
}

/** Helper para comprobar si el resultado es un error */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
