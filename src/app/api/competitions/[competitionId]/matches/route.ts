import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { logger } from "@/lib/logger";
import * as z from "zod";

const MatchesBulkUpdateSchema = z.object({
  matchesToUpdate: z.array(
    z.object({
      id: z.string().min(1, "El ID del partido es requerido."),
      matchDate: z.string().min(1, "La fecha del partido es requerida."),
    })
  ).min(1, "Se requiere al menos un partido."),
})

// PATCH: Actualizar fechas de partidos en bulk
export async function PATCH(
  req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(MatchesBulkUpdateSchema, body);
    if (!result.success) return result.response;
    const { matchesToUpdate } = result.data;

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
    logger.error("MATCHES_UPDATE", "Error al actualizar fechas de partidos", { ruta: "/api/competitions/[competitionId]/matches" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
