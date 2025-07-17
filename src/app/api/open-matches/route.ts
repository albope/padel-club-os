import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { OpenMatchStatus } from "@prisma/client";

// POST /api/open-matches
// Crea una nueva partida abierta, su reserva provisional y añade los jugadores iniciales.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const clubId = session.user.clubId;

    const body = await req.json();
    const { 
      courtId, 
      matchTime, 
      playerIds, // Se espera un array de IDs de usuario
      levelMin, 
      levelMax 
    } = body;

    // 1. Validación de datos de entrada
    if (!courtId || !matchTime || !playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return new NextResponse("Faltan datos requeridos (courtId, matchTime, playerIds)", { status: 400 });
    }

    const startTime = new Date(matchTime);
    // Asumimos que las partidas duran 90 minutos
    const endTime = new Date(startTime.getTime() + 90 * 60 * 1000);

    // 2. Validación de solapamiento de reservas
    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId: courtId,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (overlappingBooking) {
      return new NextResponse("Ya existe una reserva en esa pista y a esa hora.", { status: 409 });
    }

    // 3. Creación de todos los registros en una transacción atómica
    const newOpenMatch = await db.$transaction(async (prisma) => {
      // a. Crear la reserva provisional
      const provisionalBooking = await prisma.booking.create({
        data: {
          clubId,
          courtId,
          startTime,
          endTime,
          status: 'provisional', // Marcamos la reserva como provisional
          totalPrice: 0, // El precio se podría calcular al confirmar
        },
      });

      // b. Crear la partida abierta
      const openMatch = await prisma.openMatch.create({
        data: {
          clubId,
          courtId,
          matchTime: startTime,
          levelMin,
          levelMax,
          // El estado inicial depende de si se llena con los jugadores iniciales
          status: playerIds.length === 4 ? OpenMatchStatus.FULL : OpenMatchStatus.OPEN,
          bookingId: provisionalBooking.id, // Enlazamos con la reserva provisional
        },
      });

      // c. Añadir los jugadores a la partida
      await prisma.openMatchPlayer.createMany({
        data: playerIds.map((userId: string) => ({
          openMatchId: openMatch.id,
          userId: userId,
        })),
      });

      return openMatch;
    });

    return NextResponse.json(newOpenMatch, { status: 201 });

  } catch (error) {
    console.error("[CREATE_OPEN_MATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}