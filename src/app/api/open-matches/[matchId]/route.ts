import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// PATCH /api/open-matches/[matchId] -> Modifica una partida
export async function PATCH(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { courtId, matchTime, playerIds } = body;

    // Lógica para actualizar la partida y su reserva provisional
    // Por simplicidad, esta implementación es básica. Se podría hacer más compleja
    // para validar solapamientos al cambiar la hora/pista.
    
    await db.$transaction(async (prisma) => {
        // 1. Actualizar la partida abierta
        await prisma.openMatch.update({
            where: { id: params.matchId },
            data: {
                courtId,
                matchTime: new Date(matchTime),
            },
        });

        // 2. Actualizar los jugadores (forma simple: borrar y volver a crear)
        await prisma.openMatchPlayer.deleteMany({
            where: { openMatchId: params.matchId },
        });

        await prisma.openMatchPlayer.createMany({
            data: playerIds.map((id: string) => ({
                openMatchId: params.matchId,
                userId: id,
            })),
        });
    });

    return NextResponse.json({ message: "Partida actualizada" });

  } catch (error) {
    console.error("[UPDATE_OPEN_MATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}


// DELETE /api/open-matches/[matchId] -> Elimina una partida
export async function DELETE(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Usamos una transacción para asegurar que todo se borre correctamente
    await db.$transaction(async (prisma) => {
      const matchToDelete = await prisma.openMatch.findUnique({
        where: { id: params.matchId },
        select: { bookingId: true }
      });

      if (!matchToDelete) {
        throw new Error("Partida no encontrada");
      }
      
      // 1. Borrar jugadores de la partida
      await prisma.openMatchPlayer.deleteMany({ where: { openMatchId: params.matchId }});

      // 2. Borrar la partida en sí
      await prisma.openMatch.delete({ where: { id: params.matchId }});

      // 3. Borrar la reserva provisional asociada, si existe
      if (matchToDelete.bookingId) {
        await prisma.booking.delete({ where: { id: matchToDelete.bookingId, status: 'provisional' }});
      }
    });

    return new NextResponse(null, { status: 204 }); // Éxito, sin contenido

  } catch (error) {
    console.error("[DELETE_OPEN_MATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}