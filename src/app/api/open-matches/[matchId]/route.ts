import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// PATCH: Modificar una partida abierta
export async function PATCH(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const auth = await requireAuth("open-matches:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { courtId, matchTime, playerIds } = body;

    // Verificar que la partida pertenece al club
    const openMatch = await db.openMatch.findFirst({
      where: { id: params.matchId, clubId: auth.session.user.clubId },
    });
    if (!openMatch) {
      return new NextResponse("Partida no encontrada.", { status: 404 });
    }

    await db.$transaction(async (prisma) => {
      await prisma.openMatch.update({
        where: { id: params.matchId },
        data: { courtId, matchTime: new Date(matchTime) },
      });

      await prisma.openMatchPlayer.deleteMany({
        where: { openMatchId: params.matchId },
      });

      await prisma.openMatchPlayer.createMany({
        data: playerIds.map((id: string) => ({
          openMatchId: params.matchId, userId: id,
        })),
      });
    });

    return NextResponse.json({ message: "Partida actualizada" });
  } catch (error) {
    console.error("[UPDATE_OPEN_MATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Eliminar una partida abierta
export async function DELETE(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const auth = await requireAuth("open-matches:delete")
    if (isAuthError(auth)) return auth

    // Verificar que la partida pertenece al club
    const openMatch = await db.openMatch.findFirst({
      where: { id: params.matchId, clubId: auth.session.user.clubId },
    });
    if (!openMatch) {
      return new NextResponse("Partida no encontrada.", { status: 404 });
    }

    await db.$transaction(async (prisma) => {
      const matchToDelete = await prisma.openMatch.findUnique({
        where: { id: params.matchId },
        select: { bookingId: true },
      });

      if (!matchToDelete) throw new Error("Partida no encontrada");

      await prisma.openMatchPlayer.deleteMany({ where: { openMatchId: params.matchId } });
      await prisma.openMatch.delete({ where: { id: params.matchId } });

      if (matchToDelete.bookingId) {
        await prisma.booking.delete({ where: { id: matchToDelete.bookingId, status: 'provisional' } });
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE_OPEN_MATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
