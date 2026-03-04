import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

// DELETE: Salir de la lista de espera
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth("booking-waitlist:delete")
    if (isAuthError(auth)) return auth

    if (!params.id) {
      return NextResponse.json(
        { error: "ID de entrada requerido." },
        { status: 400 }
      )
    }

    // Verificar que la entrada pertenece al usuario y club
    const entrada = await db.bookingWaitlist.findFirst({
      where: {
        id: params.id,
        userId: auth.session.user.id,
        clubId: auth.session.user.clubId,
      },
    })

    if (!entrada) {
      return NextResponse.json(
        { error: "Entrada no encontrada." },
        { status: 404 }
      )
    }

    await db.bookingWaitlist.delete({
      where: { id: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error("WAITLIST_DELETE", "Error eliminando entrada de lista de espera", { ruta: "/api/player/bookings/waitlist/[id]", metodo: "DELETE" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
