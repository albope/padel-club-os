import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth, isAuthError } from "@/lib/api-auth"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth("settings:update")
  if (isAuthError(auth)) return auth

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
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
    console.error("[UPLOAD_ERROR]", error)
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 })
  }
}
