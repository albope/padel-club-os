import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import * as z from "zod";

const TeamUpdateSchema = z.object({
  name: z.string().min(1, "El nombre del equipo es requerido.").max(100, "El nombre no puede superar 100 caracteres.").optional(),
  player1Id: z.string().min(1).optional(),
  player2Id: z.string().min(1).optional(),
})

// PATCH: Actualizar un equipo
export async function PATCH(
  req: Request,
  { params }: { params: { competitionId: string; teamId: string } }
) {
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(TeamUpdateSchema, body);
    if (!result.success) return result.response;
    const { name, player1Id, player2Id } = result.data;

    if (!params.teamId) {
      return new NextResponse("ID de equipo requerido", { status: 400 });
    }

    // Verificar que la competicion pertenece al club
    const competition = await db.competition.findFirst({
      where: { id: params.competitionId, clubId: auth.session.user.clubId },
    });
    if (!competition) {
      return new NextResponse("Competicion no encontrada.", { status: 404 });
    }

    const updatedTeam = await db.team.update({
      where: { id: params.teamId },
      data: { name, player1Id, player2Id },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("[UPDATE_TEAM_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Eliminar un equipo
export async function DELETE(
  req: Request,
  { params }: { params: { competitionId: string; teamId: string } }
) {
  try {
    const auth = await requireAuth("competitions:delete")
    if (isAuthError(auth)) return auth

    if (!params.teamId) {
      return new NextResponse("ID de equipo requerido", { status: 400 });
    }

    // Verificar que la competicion pertenece al club
    const competition = await db.competition.findFirst({
      where: { id: params.competitionId, clubId: auth.session.user.clubId },
    });
    if (!competition) {
      return new NextResponse("Competicion no encontrada.", { status: 404 });
    }

    await db.team.delete({ where: { id: params.teamId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE_TEAM_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
