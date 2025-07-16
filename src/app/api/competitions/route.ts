import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { CompetitionFormat } from "@prisma/client";

// --- MODIFICADO: Ahora es el endpoint para /api/competitions ---

// GET: Obtener todas las competiciones
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Cambiamos db.league por db.competition
    const competitions = await db.competition.findMany({
      where: { clubId: session.user.clubId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { teams: true } } },
    });

    return NextResponse.json(competitions);
  } catch (error) {
    console.error("[GET_COMPETITIONS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Crear una nueva competición
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    // Añadimos 'format' a los datos que recibimos
    const { name, format } = body;

    if (!name || !format) {
      return new NextResponse("El nombre y el formato son requeridos", { status: 400 });
    }
    
    // Validamos que el formato sea uno de los permitidos por el enum
    if (!Object.values(CompetitionFormat).includes(format)) {
        return new NextResponse("Formato de competición no válido", { status: 400 });
    }

    // Cambiamos db.league por db.competition y añadimos el campo 'format'
    const competition = await db.competition.create({
      data: {
        name,
        format,
        clubId: session.user.clubId,
      },
    });

    return NextResponse.json(competition, { status: 201 });
  } catch (error) {
    console.error("[CREATE_COMPETITION_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}