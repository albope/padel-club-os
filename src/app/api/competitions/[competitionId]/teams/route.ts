import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// POST: Añade un nuevo equipo a una competición
export async function POST(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, player1Id, player2Id } = body;

    // --- Validación de datos de entrada ---
    if (!name || !player1Id || !player2Id || !params.competitionId) {
      return new NextResponse("Faltan campos requeridos", { status: 400 });
    }
    if (player1Id === player2Id) {
      return new NextResponse("Los jugadores deben ser diferentes", { status: 400 });
    }

    // --- CORRECCIÓN DEFINITIVA ---
    // En lugar de usar 'connect' anidado, pasamos los IDs de las claves foráneas
    // directamente. Esta es la forma "no comprobada" (unchecked) de Prisma,
    // que es más simple y evita los conflictos de tipos que estabas viendo.
    const newTeam = await db.team.create({
      data: {
        name,
        player1Id,
        player2Id,
        competitionId: params.competitionId, // Pasamos el ID de la competición directamente
      },
    });

    return NextResponse.json(newTeam, { status: 201 });

  } catch (error) {
    console.error("[ADD_TEAM_ERROR]", error);
    // Devolvemos el mensaje de error de Prisma si es una validación para depuración
    if ((error as any).code === 'P2002' || (error as any).code === 'P2003') {
        return new NextResponse("Error de validación de base de datos.", { status: 409 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}