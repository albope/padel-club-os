import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { OpenMatchStatus } from "@prisma/client";

// GET: Obtener partidas abiertas del club del jugador
export async function GET() {
  try {
    const auth = await requireAuth("open-matches:read")
    if (isAuthError(auth)) return auth

    const openMatches = await db.openMatch.findMany({
      where: {
        clubId: auth.session.user.clubId,
        status: { in: [OpenMatchStatus.OPEN, OpenMatchStatus.FULL] },
        matchTime: { gte: new Date() },
      },
      include: {
        court: { select: { name: true, type: true } },
        players: {
          include: { user: { select: { id: true, name: true, level: true, image: true } } },
        },
      },
      orderBy: { matchTime: 'asc' },
    });

    return NextResponse.json(openMatches);
  } catch (error) {
    console.error("[GET_PLAYER_OPEN_MATCHES_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Unirse a una partida abierta
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("open-matches:join")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { openMatchId } = body;

    if (!openMatchId) {
      return NextResponse.json({ error: "ID de partida requerido." }, { status: 400 });
    }

    const openMatch = await db.openMatch.findFirst({
      where: {
        id: openMatchId,
        clubId: auth.session.user.clubId,
      },
      include: { players: true },
    });

    if (!openMatch) {
      return NextResponse.json({ error: "Partida no encontrada." }, { status: 404 });
    }

    if (openMatch.status !== OpenMatchStatus.OPEN) {
      return NextResponse.json({ error: "Esta partida ya esta completa." }, { status: 400 });
    }

    // Verificar que el jugador no esta ya en la partida
    const alreadyJoined = openMatch.players.some(p => p.userId === auth.session.user.id);
    if (alreadyJoined) {
      return NextResponse.json({ error: "Ya estas en esta partida." }, { status: 409 });
    }

    // Verificar nivel si hay restricciones
    if (openMatch.levelMin || openMatch.levelMax) {
      const player = await db.user.findUnique({
        where: { id: auth.session.user.id },
        select: { level: true },
      });
      const playerLevel = player?.level ? parseFloat(player.level) : null;
      if (playerLevel !== null) {
        if (openMatch.levelMin && playerLevel < openMatch.levelMin) {
          return NextResponse.json({ error: "Tu nivel es inferior al minimo requerido." }, { status: 403 });
        }
        if (openMatch.levelMax && playerLevel > openMatch.levelMax) {
          return NextResponse.json({ error: "Tu nivel supera el maximo permitido." }, { status: 403 });
        }
      }
    }

    await db.$transaction(async (tx) => {
      await tx.openMatchPlayer.create({
        data: { openMatchId, userId: auth.session.user.id },
      });

      // Si ahora hay 4 jugadores, marcar como FULL
      const playerCount = openMatch.players.length + 1;
      if (playerCount >= 4) {
        await tx.openMatch.update({
          where: { id: openMatchId },
          data: { status: OpenMatchStatus.FULL },
        });
      }
    });

    return NextResponse.json({ message: "Te has unido a la partida." });
  } catch (error) {
    console.error("[JOIN_OPEN_MATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Salir de una partida abierta
export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth("open-matches:join")
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(req.url);
    const openMatchId = searchParams.get("openMatchId");

    if (!openMatchId) {
      return NextResponse.json({ error: "ID de partida requerido." }, { status: 400 });
    }

    const openMatch = await db.openMatch.findFirst({
      where: { id: openMatchId, clubId: auth.session.user.clubId },
      include: { players: true },
    });

    if (!openMatch) {
      return NextResponse.json({ error: "Partida no encontrada." }, { status: 404 });
    }

    const isInMatch = openMatch.players.some(p => p.userId === auth.session.user.id);
    if (!isInMatch) {
      return NextResponse.json({ error: "No estas en esta partida." }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.openMatchPlayer.delete({
        where: { openMatchId_userId: { openMatchId, userId: auth.session.user.id } },
      });

      // Si estaba FULL, volver a OPEN
      if (openMatch.status === OpenMatchStatus.FULL) {
        await tx.openMatch.update({
          where: { id: openMatchId },
          data: { status: OpenMatchStatus.OPEN },
        });
      }
    });

    return NextResponse.json({ message: "Has salido de la partida." });
  } catch (error) {
    console.error("[LEAVE_OPEN_MATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
