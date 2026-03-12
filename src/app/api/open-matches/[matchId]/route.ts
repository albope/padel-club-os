import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { OpenMatchStatus } from "@prisma/client";
import { calcularPrecioReserva } from "@/lib/pricing";
import { validarBody } from "@/lib/validation";
import { liberarSlotYNotificar, limpiarWaitlistAlReservar } from "@/lib/waitlist";
import { verificarBloqueo } from "@/lib/court-blocks";
import { logger } from "@/lib/logger";
import * as z from "zod";

const OpenMatchUpdateSchema = z.object({
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

// PATCH: Modificar una partida abierta
export async function PATCH(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const auth = await requireAuth("open-matches:update")
    if (isAuthError(auth)) return auth
    const clubId = auth.session.user.clubId;

    const body = await req.json();
    const result = validarBody(OpenMatchUpdateSchema, body);
    if (!result.success) return result.response;
    const { courtId, matchTime, playerIds, levelMin, levelMax } = result.data;

    // Cargar partida con su booking asociado
    const openMatch = await db.openMatch.findFirst({
      where: { id: params.matchId, clubId },
      include: {
        booking: { select: { id: true, courtId: true, startTime: true, endTime: true } },
      },
    });
    if (!openMatch) {
      return new NextResponse("Partida no encontrada.", { status: 404 });
    }

    // Verificar integridad: booking provisional debe existir
    if (!openMatch.bookingId || !openMatch.booking) {
      return new NextResponse("Inconsistencia de datos: la partida no tiene reserva provisional asociada.", { status: 409 });
    }

    // Verificar pista pertenece al club y obtener duracion
    const [pista, club] = await Promise.all([
      db.court.findFirst({ where: { id: courtId, clubId }, select: { id: true, name: true } }),
      db.club.findUnique({ where: { id: clubId }, select: { bookingDuration: true, slug: true, name: true } }),
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

    // Overlap check excluyendo el booking actual de esta partida
    const overlapping = await db.booking.findFirst({
      where: {
        courtId,
        status: { not: "cancelled" },
        id: { not: openMatch.bookingId },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (overlapping) {
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

    // Recalcular precio para el nuevo slot
    const totalPrice = await calcularPrecioReserva(courtId, clubId, startTime, endTime);

    // Detectar si cambia pista u hora para gestionar waitlist
    const slotCambio =
      openMatch.booking.courtId !== courtId ||
      openMatch.booking.startTime.getTime() !== startTime.getTime();

    // Guardar datos del slot original para waitlist
    const slotOriginal = {
      courtId: openMatch.booking.courtId,
      startTime: openMatch.booking.startTime,
      endTime: openMatch.booking.endTime,
    };

    await db.$transaction(async (prisma) => {
      // Actualizar partida abierta
      await prisma.openMatch.update({
        where: { id: params.matchId },
        data: {
          courtId,
          matchTime: startTime,
          levelMin: levelMin ?? null,
          levelMax: levelMax ?? null,
          status: playerIds.length === 4 ? OpenMatchStatus.FULL : OpenMatchStatus.OPEN,
        },
      });

      // Sincronizar booking provisional
      await prisma.booking.update({
        where: { id: openMatch.bookingId! },
        data: { courtId, startTime, endTime, totalPrice },
      });

      // Reemplazar jugadores
      await prisma.openMatchPlayer.deleteMany({
        where: { openMatchId: params.matchId },
      });

      await prisma.openMatchPlayer.createMany({
        data: playerIds.map((id: string) => ({
          openMatchId: params.matchId, userId: id,
        })),
      });
    });

    // Gestionar waitlist si el slot cambio (fire-and-forget)
    if (slotCambio) {
      // Liberar slot original y notificar a la gente en espera
      liberarSlotYNotificar({
        courtId: slotOriginal.courtId,
        startTime: slotOriginal.startTime,
        endTime: slotOriginal.endTime,
        clubId,
        clubSlug: club?.slug || "",
        clubNombre: club?.name || "",
        pistaNombre: pista.name || "Pista",
      }).catch(() => {})

      // Limpiar waitlist del nuevo slot
      limpiarWaitlistAlReservar({ courtId, startTime }).catch(() => {})
    }

    return NextResponse.json({ message: "Partida actualizada" });
  } catch (error) {
    logger.error("OPEN_MATCH_UPDATE", "Error al actualizar partida abierta", {}, error);
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
        await prisma.booking.delete({ where: { id: matchToDelete.bookingId } });
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("OPEN_MATCH_DELETE", "Error al eliminar partida abierta", {}, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
