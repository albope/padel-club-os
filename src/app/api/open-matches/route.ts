import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { OpenMatchStatus } from "@prisma/client";
import { calcularPrecioReserva } from "@/lib/pricing";
import { validarBody } from "@/lib/validation";
import { limpiarWaitlistAlReservar } from "@/lib/waitlist";
import { verificarBloqueo } from "@/lib/court-blocks";
import { logger } from "@/lib/logger";
import * as z from "zod";
import { respuestaErrorReserva, validarRangoReserva } from "@/lib/booking-domain";

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
      db.club.findUnique({
        where: { id: clubId },
        select: {
          bookingDuration: true,
          timezone: true,
          openingTime: true,
          closingTime: true,
          maxAdvanceBooking: true,
        },
      }),
    ]);

    if (!pista) {
      return new NextResponse("Pista no encontrada en este club.", { status: 404 });
    }

    // Verificar que todos los jugadores existen y pertenecen al club
    const jugadores = await db.clubMembership.findMany({
      where: {
        userId: { in: playerIds },
        clubId,
        role: "PLAYER",
        status: "ACTIVE",
      },
      select: { userId: true },
    });
    if (jugadores.length !== playerIds.length) {
      return new NextResponse("Uno o mas jugadores no son validos o no pertenecen al club.", { status: 400 });
    }

    const startTime = new Date(matchTime);
    const duracionMinutos = club?.bookingDuration || 90;
    const endTime = new Date(startTime.getTime() + duracionMinutos * 60 * 1000);
    if (!club) {
      return NextResponse.json({ error: "Club no encontrado." }, { status: 404 })
    }
    validarRangoReserva({
      startTime,
      endTime,
      policy: club,
      requireFuture: true,
    })

    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId,
        clubId,
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

    // Verificar bloqueo de pista
    const bloqueo = await verificarBloqueo(clubId, courtId, startTime, endTime);
    if (bloqueo) {
      return NextResponse.json(
        { error: `La pista esta bloqueada en ese horario (${bloqueo.reason}${bloqueo.note ? `: ${bloqueo.note}` : ""}).` },
        { status: 409 }
      );
    }

    const totalPrice = await calcularPrecioReserva(courtId, clubId, startTime, endTime);

    const newOpenMatch = await db.$transaction(async (prisma) => {
      const provisionalBooking = await prisma.booking.create({
        data: {
          clubId, courtId, startTime, endTime,
          status: 'confirmed', totalPrice,
          paymentStatus: "exempt",
          paymentMethod: "exempt",
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
    const domainError = respuestaErrorReserva(error)
    if (domainError) {
      return NextResponse.json(
        { error: domainError.message, code: domainError.code },
        { status: domainError.status },
      )
    }
    logger.error("OPEN_MATCH_CREATE", "Error al crear partida abierta", { }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
