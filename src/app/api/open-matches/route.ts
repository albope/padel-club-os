import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { OpenMatchStatus } from "@prisma/client";
import { calcularPrecioReserva } from "@/lib/pricing";
import { validarBody } from "@/lib/validation";
import { limpiarWaitlistAlReservar } from "@/lib/waitlist";
import { logger } from "@/lib/logger";
import * as z from "zod";

const OpenMatchCreateSchema = z.object({
  courtId: z.string().min(1, "El ID de pista es requerido."),
  matchTime: z.string().min(1, "La hora del partido es requerida."),
  playerIds: z.array(z.string().min(1)).min(1, "Se requiere al menos un jugador.").max(4, "Maximo 4 jugadores.")
    .refine(ids => new Set(ids).size === ids.length, "No se permiten jugadores duplicados."),
  levelMin: z.number().min(1).max(7).optional().nullable(),
  levelMax: z.number().min(1).max(7).optional().nullable(),
}).refine(
  data => !data.levelMin || !data.levelMax || data.levelMin <= data.levelMax,
  { message: "El nivel minimo no puede ser mayor que el maximo.", path: ["levelMin"] }
)

// POST: Crear una nueva partida abierta
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("open-matches:create", { requireSubscription: true })
    if (isAuthError(auth)) return auth
    const clubId = auth.session.user.clubId;

    const body = await req.json();
    const result = validarBody(OpenMatchCreateSchema, body);
    if (!result.success) return result.response;
    const { courtId, matchTime, playerIds, levelMin, levelMax } = result.data;

    // Verificar pista pertenece al club y obtener duracion de reserva
    const [pista, club] = await Promise.all([
      db.court.findFirst({ where: { id: courtId, clubId }, select: { id: true } }),
      db.club.findUnique({ where: { id: clubId }, select: { bookingDuration: true } }),
    ]);

    if (!pista) {
      return new NextResponse("Pista no encontrada en este club.", { status: 404 });
    }

    // Verificar que todos los jugadores existen y pertenecen al club
    const jugadores = await db.user.findMany({
      where: { id: { in: playerIds }, clubId },
      select: { id: true },
    });
    if (jugadores.length !== playerIds.length) {
      return new NextResponse("Uno o mas jugadores no son validos o no pertenecen al club.", { status: 400 });
    }

    const startTime = new Date(matchTime);
    const duracionMinutos = club?.bookingDuration || 90;
    const endTime = new Date(startTime.getTime() + duracionMinutos * 60 * 1000);

    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId,
        status: { not: "cancelled" },
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

    // Limpiar lista de espera del slot
    limpiarWaitlistAlReservar({ courtId, startTime }).catch(() => {})

    return NextResponse.json(newOpenMatch, { status: 201 });
  } catch (error) {
    logger.error("OPEN_MATCH_CREATE", "Error al crear partida abierta", { }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
