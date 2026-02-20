import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// PATCH: Actualizar una pista
export async function PATCH(
  req: Request,
  { params }: { params: { courtId: string } }
) {
  try {
    const auth = await requireAuth("courts:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { name, type } = body;

    if (!params.courtId) {
      return new NextResponse("ID de pista requerido", { status: 400 });
    }

    const updatedCourt = await db.court.update({
      where: { id: params.courtId, clubId: auth.session.user.clubId },
      data: { name, type },
    });

    return NextResponse.json(updatedCourt);
  } catch (error) {
    console.error("[UPDATE_COURT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Eliminar una pista
export async function DELETE(
  req: Request,
  { params }: { params: { courtId: string } }
) {
  try {
    const auth = await requireAuth("courts:delete")
    if (isAuthError(auth)) return auth

    if (!params.courtId) {
      return new NextResponse("ID de pista requerido", { status: 400 });
    }

    await db.court.delete({
      where: { id: params.courtId, clubId: auth.session.user.clubId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE_COURT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
