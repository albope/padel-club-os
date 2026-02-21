import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { OpenMatchStatus } from "@prisma/client";
import { calcularPrecioReserva } from "@/lib/pricing";

// POST: Crear una nueva partida abierta
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("open-matches:create")
    if (isAuthError(auth)) return auth
    const clubId = auth.session.user.clubId;

    const body = await req.json();
    const { courtId, matchTime, playerIds, levelMin, levelMax } = body;

    if (!courtId || !matchTime || !playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return new NextResponse("Faltan datos requeridos (courtId, matchTime, playerIds)", { status: 400 });
    }

    const startTime = new Date(matchTime);
    const endTime = new Date(startTime.getTime() + 90 * 60 * 1000);

    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (overlappingBooking) {
      return new NextResponse("Ya existe una reserva en esa pista y a esa hora.", { status: 409 });
    }

    const totalPrice = await calcularPrecioReserva(courtId, clubId, startTime, endTime);

    const newOpenMatch = await db.$transaction(async (prisma) => {
      const provisionalBooking = await prisma.booking.create({
        data: {
          clubId, courtId, startTime, endTime,
          status: 'provisional', totalPrice,
          paymentStatus: "exempt",
        },
      });

      const openMatch = await prisma.openMatch.create({
        data: {
          clubId, courtId, matchTime: startTime,
          levelMin, levelMax,
          status: playerIds.length === 4 ? OpenMatchStatus.FULL : OpenMatchStatus.OPEN,
          bookingId: provisionalBooking.id,
        },
      });

      await prisma.openMatchPlayer.createMany({
        data: playerIds.map((userId: string) => ({
          openMatchId: openMatch.id, userId,
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
