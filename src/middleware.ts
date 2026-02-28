import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Rutas del dashboard exentas de verificacion de suscripcion
// (el admin necesita acceder a estas aunque la suscripcion este inactiva)
const SUBSCRIPTION_EXEMPT_PATHS = [
  "/dashboard/facturacion",
  "/dashboard/ajustes",
  "/dashboard/configuracion-inicial",
]

/**
 * Verifica si la suscripcion esta activa basandose en el token JWT.
 * Replica la logica de isSubscriptionActive() de subscription.ts
 * para evitar imports dinamicos en middleware Edge.
 */
function isTokenSubscriptionActive(token: { subscriptionStatus?: string | null; trialEndsAt?: string | null }): boolean {
  const status = token.subscriptionStatus ?? "trialing"

  if (status === "active") return true

  if (status === "trialing") {
    if (!token.trialEndsAt) return true
    return new Date(token.trialEndsAt) > new Date()
  }

  return false
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Rutas del dashboard: solo SUPER_ADMIN, CLUB_ADMIN y STAFF
    if (pathname.startsWith("/dashboard")) {
      const adminRoles = ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"]
      if (!token?.role || !adminRoles.includes(token.role as string)) {
        // Si es PLAYER, redirigir al portal de su club
        if (token?.role === "PLAYER" && token?.clubId) {
          return NextResponse.redirect(new URL("/", req.url))
        }
        return NextResponse.redirect(new URL("/login", req.url))
      }

      // Verificar suscripcion activa para rutas del dashboard
      const isExempt = SUBSCRIPTION_EXEMPT_PATHS.some((p) => pathname.startsWith(p))
      if (!isExempt && !isTokenSubscriptionActive(token)) {
        return NextResponse.redirect(new URL("/dashboard/facturacion", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Rutas publicas: no requieren auth
        if (
          pathname === "/" ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/forgot-password") ||
          pathname.startsWith("/reset-password") ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/register") ||
          pathname.startsWith("/api/stripe/webhook") ||
          pathname.startsWith("/api/stripe/checkout") ||
          pathname.startsWith("/api/stripe/portal") ||
          pathname.startsWith("/api/cron") ||
          pathname.startsWith("/api/consent") ||
          pathname.startsWith("/api/contact") ||
          pathname.startsWith("/api/health") ||
          pathname.startsWith("/api/blog/public") ||
          pathname.startsWith("/api/club/") ||
          pathname.startsWith("/club")
        ) {
          return true
        }

        // Todo lo demas requiere token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // Proteger dashboard y APIs, excluir archivos estaticos
    "/dashboard/:path*",
    "/api/:path*",
    // No proteger: /_next, /favicon.ico, archivos estaticos
  ],
}
