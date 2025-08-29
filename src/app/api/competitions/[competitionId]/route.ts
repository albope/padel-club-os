// Path: src/app/api/competitions/[competitionId]/route.ts
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { CompetitionStatus } from "@prisma/client";

// PATCH: Actualiza el estado de una competición (ej. para finalizarla)
export async function PATCH(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(CompetitionStatus).includes(status)) {
      return new NextResponse("Estado no válido.", { status: 400 });
    }

    const updatedCompetition = await db.competition.update({
      where: { id: params.competitionId, clubId: session.user.clubId },
      data: { status },
    });

    return NextResponse.json(updatedCompetition);
  } catch (error) {
    console.error("[COMPETITION_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Elimina una competición y todos sus datos asociados
export async function DELETE(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Prisma se encargará de borrar en cascada los equipos y partidos asociados
    await db.competition.delete({
      where: {
        id: params.competitionId,
        clubId: session.user.clubId, // Seguridad
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[COMPETITION_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}