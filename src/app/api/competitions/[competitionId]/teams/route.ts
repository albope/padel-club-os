import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { validarJugadoresEquipo } from "@/lib/competition-teams";
import * as z from "zod";

const TeamCreateSchema = z.object({
  name: z.string().min(1, "El nombre del equipo es requerido.").max(100, "El nombre no puede superar 100 caracteres."),
  player1Id: z.string().min(1, "El jugador 1 es requerido."),
  player2Id: z.string().min(1, "El jugador 2 es requerido."),
}).refine(
  (data) => data.player1Id !== data.player2Id,
  { message: "Los jugadores deben ser diferentes.", path: ["player2Id"] }
)

// POST: Añade un nuevo equipo a una competición
export async function POST(req: Request, props: { params: Promise<{ competitionId: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(TeamCreateSchema, body);
    if (!result.success) return result.response;
    const { name, player1Id, player2Id } = result.data;

    const competition = await db.competition.findFirst({
      where: {
        id: params.competitionId,
        clubId: auth.session.user.clubId,
      },
      select: { status: true },
    });
    if (!competition) {
      return NextResponse.json(
        { error: "Competición no encontrada." },
        { status: 404 }
      );
    }
    if (competition.status === "FINISHED") {
      return NextResponse.json(
        { error: "No se pueden añadir equipos a una competición finalizada." },
        { status: 409 }
      );
    }

    const validacionJugadores = await validarJugadoresEquipo({
      clubId: auth.session.user.clubId,
      competitionId: params.competitionId,
      playerIds: [player1Id, player2Id],
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

    const newTeam = await db.team.create({
      data: {
        name,
        player1Id,
        player2Id,
        competitionId: params.competitionId,
      },
    });

    return NextResponse.json(newTeam, { status: 201 });

  } catch (error) {
    logger.error("TEAM_CREATE", "Error al añadir equipo a competicion", {
      ruta: "/api/competitions/[competitionId]/teams",
      competitionId: params.competitionId,
    }, error);
    const codigo = typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : null;
    if (codigo === "P2002") {
      return NextResponse.json(
        { error: "Ese equipo ya está inscrito en la competición." },
        { status: 409 }
      );
    }
    if (codigo === "P2003") {
      return NextResponse.json(
        { error: "Uno o ambos jugadores ya no están disponibles." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
