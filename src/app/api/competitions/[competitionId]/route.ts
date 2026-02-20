import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { CompetitionStatus } from "@prisma/client";

// PATCH: Actualizar estado de una competicion
export async function PATCH(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(CompetitionStatus).includes(status)) {
      return new NextResponse("Estado no válido.", { status: 400 });
    }

    const updatedCompetition = await db.competition.update({
      where: { id: params.competitionId, clubId: auth.session.user.clubId },
      data: { status },
    });

    return NextResponse.json(updatedCompetition);
  } catch (error) {
    console.error("[COMPETITION_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Eliminar una competicion y todos sus datos asociados
export async function DELETE(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const auth = await requireAuth("competitions:delete")
    if (isAuthError(auth)) return auth

    await db.competition.delete({
      where: { id: params.competitionId, clubId: auth.session.user.clubId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[COMPETITION_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
