import { verificarEmailConToken } from "@/lib/tokens"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

function rutaSegura(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/login"
  if (value === "/login" || /^\/club\/[a-z0-9-]+\/login$/.test(value)) return value
  return "/login"
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token")
  const next = rutaSegura(url.searchParams.get("next"))

  if (!token) {
    return NextResponse.redirect(new URL(`${next}?verification=invalid`, url.origin))
  }

  try {
    const email = await verificarEmailConToken(token)
    const estado = email ? "success" : "invalid"
    return NextResponse.redirect(new URL(`${next}?verification=${estado}`, url.origin))
  } catch (error) {
    logger.error(
      "VERIFY_EMAIL",
      "Error verificando el correo",
      { ruta: "/api/auth/verify-email" },
      error,
    )
    return NextResponse.redirect(new URL(`${next}?verification=error`, url.origin))
  }
}
