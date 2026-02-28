import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import * as z from "zod";

const CompetitionUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "FINISHED"], {
    errorMap: () => ({ message: "Estado no valido." }),
  }),
})

// PATCH: Actualizar estado de una competicion
export async function PATCH(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(CompetitionUpdateSchema, body);
    if (!result.success) return result.response;
    const { status } = result.data;

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
