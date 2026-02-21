import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

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
          // Buscar slug no es posible en middleware, redirigir a /
          return NextResponse.redirect(new URL("/", req.url))
        }
        return NextResponse.redirect(new URL("/login", req.url))
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
          pathname.startsWith("/auth") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/register") ||
          pathname.startsWith("/api/stripe/webhook") ||
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
