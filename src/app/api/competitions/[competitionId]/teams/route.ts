import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// POST: Añade un nuevo equipo a una competición
export async function POST(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { name, player1Id, player2Id } = body;

    if (!name || !player1Id || !player2Id || !params.competitionId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }
    if (player1Id === player2Id) {
      return NextResponse.json(
        { error: "Los jugadores deben ser diferentes" },
        { status: 400 }
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
