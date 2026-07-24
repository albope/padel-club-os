import { db } from "@/lib/db"
import { enviarEmailVerificacion } from "@/lib/email"
import { normalizarEmail } from "@/lib/identity"
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit"
import { crearTokenVerificacionEmail } from "@/lib/tokens"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import * as z from "zod"

const Schema = z.object({
  email: z.string().email().max(255),
  next: z.string().max(160).optional(),
})
const limiter = crearRateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
  prefix: "rl:resend-verification",
})
const GENERIC_MESSAGE =
  "Si existe una cuenta pendiente de verificar, recibiras un email en unos minutos."

export async function POST(req: Request) {
  const ip = obtenerIP(req)
  if (!(await limiter.verificar(ip))) {
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 202 })
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 202 })
  }

  const email = normalizarEmail(parsed.data.email)
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, emailVerified: true },
  })

  if (user && !user.emailVerified) {
    try {
      const token = await crearTokenVerificacionEmail(email)
      await enviarEmailVerificacion({
        email,
        nombre: user.name,
        token,
        next: parsed.data.next,
      })
    } catch (error) {
      logger.error(
        "RESEND_VERIFICATION",
        "No se pudo reenviar la verificacion",
        { userId: user.id },
        error,
      )
    }
  }
  return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 202 })
}
