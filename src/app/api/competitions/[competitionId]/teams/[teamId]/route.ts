import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { validarJugadoresEquipo } from "@/lib/competition-teams";
import * as z from "zod";

const TeamUpdateSchema = z.object({
  name: z.string().min(1, "El nombre del equipo es requerido.").max(100, "El nombre no puede superar 100 caracteres.").optional(),
  player1Id: z.string().min(1).optional(),
  player2Id: z.string().min(1).optional(),
}).refine(
  (data) => data.name !== undefined || data.player1Id !== undefined || data.player2Id !== undefined,
  { message: "Debes indicar al menos un cambio." }
)

// PATCH: Actualizar un equipo
export async function PATCH(
  req: Request,
  props: { params: Promise<{ competitionId: string; teamId: string }> }
) {
  const params = await props.params;
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
      return NextResponse.json({ error: "Competición no encontrada." }, { status: 404 });
    }
    if (competition.status === "FINISHED") {
      return NextResponse.json(
        { error: "No se pueden editar equipos de una competición finalizada." },
        { status: 409 }
      );
    }

    const team = await db.team.findFirst({
      where: {
        id: params.teamId,
        competitionId: params.competitionId,
      },
      select: { player1Id: true, player2Id: true },
    });
    if (!team) {
      return NextResponse.json({ error: "Equipo no encontrado." }, { status: 404 });
    }

    const siguientePlayer1Id = player1Id ?? team.player1Id;
    const siguientePlayer2Id = player2Id ?? team.player2Id;
    if (siguientePlayer1Id === siguientePlayer2Id) {
      return NextResponse.json(
        { error: "Los jugadores deben ser diferentes." },
        { status: 400 }
      );
    }

    const validacionJugadores = await validarJugadoresEquipo({
      clubId: auth.session.user.clubId,
      competitionId: params.competitionId,
      playerIds: [siguientePlayer1Id, siguientePlayer2Id],
      teamIdExcluido: params.teamId,
    });
    if (!validacionJugadores.valido) {
      return NextResponse.json(
        {
          error: validacionJugadores.error,
          codigo: validacionJugadores.codigo,
        },
        { status: validacionJugadores.status }
      );
    }

    const updatedTeam = await db.team.update({
      where: { id: params.teamId },
      data: { name, player1Id, player2Id },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    logger.error("TEAM_UPDATE", "Error al actualizar equipo", {
      ruta: "/api/competitions/[competitionId]/teams/[teamId]",
      competitionId: params.competitionId,
      teamId: params.teamId,
    }, error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE: Eliminar un equipo
export async function DELETE(
  req: Request,
  props: { params: Promise<{ competitionId: string; teamId: string }> }
) {
  const params = await props.params;
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
      return NextResponse.json({ error: "Competición no encontrada." }, { status: 404 });
    }

    const team = await db.team.findFirst({
      where: {
        id: params.teamId,
        competitionId: params.competitionId,
      },
      select: { id: true },
    });
    if (!team) {
      return NextResponse.json({ error: "Equipo no encontrado." }, { status: 404 });
    }

    await db.team.delete({ where: { id: params.teamId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("TEAM_DELETE", "Error al eliminar equipo", {
      ruta: "/api/competitions/[competitionId]/teams/[teamId]",
      competitionId: params.competitionId,
      teamId: params.teamId,
    }, error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
