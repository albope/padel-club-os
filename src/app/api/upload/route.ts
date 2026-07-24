import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { logger } from "@/lib/logger"
import { crearRateLimiter } from "@/lib/rate-limit"

const uploadLimiter = crearRateLimiter({
  maxRequests: 20,
  windowMs: 24 * 60 * 60 * 1000,
  prefix: "rl:upload-token",
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth("settings:update")
  if (isAuthError(auth)) return auth

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await uploadLimiter.verificar(auth.session.user.id))) {
          throw new Error("Limite diario de subidas alcanzado")
        }
        if (!/^[a-z0-9][a-z0-9._-]{0,119}\.(?:jpe?g|png|webp|gif)$/i.test(pathname)) {
          throw new Error("Nombre de archivo no valido")
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
          addRandomSuffix: true,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({
            clubId: auth.session.user.clubId,
          }),
        }
      },
      onUploadCompleted: async () => {
        // No necesitamos hacer nada aqui, el bannerUrl se guarda en el PATCH de /api/club
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    logger.error("UPLOAD", "Error al subir imagen", { ruta: "/api/upload" }, error)
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 })
  }
}
