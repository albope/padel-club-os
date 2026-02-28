import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
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
export async function POST(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(TeamCreateSchema, body);
    if (!result.success) return result.response;
    const { name, player1Id, player2Id } = result.data;

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
    console.error("[ADD_TEAM_ERROR]", error);
    if ((error as any).code === 'P2002' || (error as any).code === 'P2003') {
      return NextResponse.json(
        { error: "Error de validación de base de datos." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
