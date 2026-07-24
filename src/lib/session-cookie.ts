import { encode } from "next-auth/jwt"
import type { JWT } from "next-auth/jwt"
import { NextResponse } from "next/server"

const SESSION_MAX_AGE = 30 * 24 * 60 * 60

function authSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET_NOT_CONFIGURED")
  return secret
}

function secureCookie(): boolean {
  return process.env.NEXTAUTH_URL?.startsWith("https://")
    || Boolean(process.env.VERCEL)
}

export async function emitirSesionJwt(
  token: JWT,
  maxAge = SESSION_MAX_AGE,
): Promise<string> {
  return encode({ token, secret: authSecret(), maxAge })
}

export function establecerCookieSesion(
  response: NextResponse,
  value: string,
  maxAge = SESSION_MAX_AGE,
): void {
  const segura = secureCookie()
  const activa = segura
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token"
  const alternativa = segura
    ? "next-auth.session-token"
    : "__Secure-next-auth.session-token"
  response.cookies.delete(alternativa)
  response.cookies.set(activa, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: segura,
    path: "/",
    maxAge,
  })
}

export function origenPermitido(req: Request): boolean {
  const origin = req.headers.get("origin")
  if (!origin) return process.env.NODE_ENV !== "production"
  const requestOrigin = new URL(req.url).origin
  const configured = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  const expected = configured ? new URL(configured).origin : requestOrigin
  return origin === requestOrigin || origin === expected
}
