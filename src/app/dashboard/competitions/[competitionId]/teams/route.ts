import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// POST: Crear un equipo para una competicion
export async function POST(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { name, player1Id, player2Id } = body;

    if (!name || !player1Id || !player2Id) {
      return new NextResponse("Faltan campos requeridos", { status: 400 });
    }

    if (player1Id === player2Id) {
      return new NextResponse("Los jugadores deben ser diferentes", { status: 400 });
    }

    // Verificar que la competicion pertenece al club
    const competition = await db.competition.findFirst({
      where: { id: params.competitionId, clubId: auth.session.user.clubId },
    });
    if (!competition) {
      return new NextResponse("Competicion no encontrada.", { status: 404 });
    }

    const newTeam = await db.team.create({
      data: {
        name, player1Id, player2Id,
        competitionId: params.competitionId,
      },
    });

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    console.error("[ADD_TEAM_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
