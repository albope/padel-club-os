import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// PATCH: Actualizar fechas de partidos en bulk
export async function PATCH(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { matchesToUpdate } = body;

    if (!Array.isArray(matchesToUpdate) || matchesToUpdate.length === 0) {
      return new NextResponse("Datos de partidos invalidos.", { status: 400 });
    }

    // Verificar que la competicion pertenece al club
    const competition = await db.competition.findFirst({
      where: { id: params.competitionId, clubId: auth.session.user.clubId },
    });
    if (!competition) {
      return new NextResponse("Competicion no encontrada.", { status: 404 });
    }

    const transaction = matchesToUpdate.map((match: { id: string; matchDate: string }) =>
      db.match.update({
        where: { id: match.id },
        data: { matchDate: new Date(match.matchDate) },
      })
    );

    await db.$transaction(transaction);

    return NextResponse.json({ message: "Fechas de partidos actualizadas con exito." });
  } catch (error) {
    console.error("[UPDATE_MATCHES_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
