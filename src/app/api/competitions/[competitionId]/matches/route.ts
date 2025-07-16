import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// This API route handles bulk updating of match dates for a league

export async function PATCH(
  req: Request,
  { params }: { params: { leagueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { matchesToUpdate } = body; // Expects an array of { id, matchDate }

    // Security and validation
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!Array.isArray(matchesToUpdate) || matchesToUpdate.length === 0) {
      return new NextResponse("Datos de partidos inválidos.", { status: 400 });
    }

    // Use a transaction to update all matches at once
    const transaction = matchesToUpdate.map(match => 
      db.match.update({
        where: {
          id: match.id,
          leagueId: params.leagueId, // Ensure we only update matches in this league
        },
        data: {
          matchDate: new Date(match.matchDate),
        },
      })
    );

    await db.$transaction(transaction);

    return NextResponse.json({ message: "Fechas de partidos actualizadas con éxito." });

  } catch (error) {
    console.error("[UPDATE_MATCHES_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}