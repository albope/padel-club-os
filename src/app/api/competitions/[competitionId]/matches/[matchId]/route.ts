import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { CompetitionFormat, Prisma } from "@prisma/client";
import { calculateMatchRatings, eloANivel } from "@/lib/elo";
import { crearNotificacion } from "@/lib/notifications";
import { validarBody } from "@/lib/validation";
import * as z from "zod";

const MatchResultSchema = z.object({
  result: z.string().max(50, "El resultado no puede superar 50 caracteres.").optional().nullable(),
})

// --- Tipos ---
interface TeamInfo {
  player1Id: string;
  player2Id: string;
  name: string;
}

interface ParsedStats {
  team1SetsWon: number;
  team2SetsWon: number;
  team1GamesWon: number;
  team2GamesWon: number;
}

interface JugadorNotificacion {
  userId: string;
  nuevoElo: number;
  delta: number;
}

// --- Funciones Helper ---
function updateStats(tx: Prisma.TransactionClient, teamId: string, stats: any, operation: 'increment' | 'decrement') {
  return tx.team.update({
    where: { id: teamId },
    data: {
      points: { [operation]: stats.points },
      played: { [operation]: stats.played },
      won: { [operation]: stats.won },
      lost: { [operation]: stats.lost },
      setsFor: { [operation]: stats.setsFor },
      setsAgainst: { [operation]: stats.setsAgainst },
      gamesFor: { [operation]: stats.gamesFor },
      gamesAgainst: { [operation]: stats.gamesAgainst },
    },
  });
}

function parseResult(result: string | null | undefined) {
  if (!result) {
    return { team1SetsWon: 0, team2SetsWon: 0, team1GamesWon: 0, team2GamesWon: 0, sanitizedResult: "" };
  }
  const sanitizedResult = result.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const sets = sanitizedResult.split(' ');
  let team1SetsWon = 0, team2SetsWon = 0, team1GamesWon = 0, team2GamesWon = 0;
  for (const setStr of sets) {
    if (!setStr) continue;
    const games = setStr.split('-').map(s => parseInt(s.trim(), 10));
    if (games.length !== 2 || isNaN(games[0]) || isNaN(games[1])) continue;
    const [team1Score, team2Score] = games;
    team1GamesWon += team1Score;
    team2GamesWon += team2Score;
    if (team1Score > team2Score) team1SetsWon++;
    else if (team2Score > team1Score) team2SetsWon++;
  }
  return { team1SetsWon, team2SetsWon, team1GamesWon, team2GamesWon, sanitizedResult };
}

// --- ELO Helpers ---

async function actualizarPlayerStats(
  tx: Prisma.TransactionClient,
  team1: TeamInfo,
  team2: TeamInfo,
  winnerId: string,
  team1Id: string,
  stats: ParsedStats,
  clubId: string,
): Promise<JugadorNotificacion[]> {
  const jugadoresEquipo1 = [team1.player1Id, team1.player2Id];
  const jugadoresEquipo2 = [team2.player1Id, team2.player2Id];
  const todosJugadores = [...jugadoresEquipo1, ...jugadoresEquipo2];

  // Buscar o crear PlayerStats para los 4 jugadores
  const statsActuales = await Promise.all(
    todosJugadores.map(userId =>
      tx.playerStats.upsert({
        where: { userId_clubId: { userId, clubId } },
        create: { userId, clubId, eloRating: 1500 },
        update: {},
      })
    )
  );

  const [p1t1Stats, p2t1Stats, p1t2Stats, p2t2Stats] = statsActuales;

  // Calcular nuevos ELOs
  const esEquipo1Ganador = winnerId === team1Id;
  const eloResult = calculateMatchRatings({
    team1Ratings: [p1t1Stats.eloRating, p2t1Stats.eloRating],
    team2Ratings: [p1t2Stats.eloRating, p2t2Stats.eloRating],
    winner: esEquipo1Ganador ? 1 : 2,
    gamesPlayedTeam1: [p1t1Stats.matchesPlayed, p2t1Stats.matchesPlayed],
    gamesPlayedTeam2: [p1t2Stats.matchesPlayed, p2t2Stats.matchesPlayed],
  });

  // Determinar sets/games por equipo
  const ganadorSetsWon = esEquipo1Ganador ? stats.team1SetsWon : stats.team2SetsWon;
  const ganadorSetsLost = esEquipo1Ganador ? stats.team2SetsWon : stats.team1SetsWon;
  const ganadorGamesWon = esEquipo1Ganador ? stats.team1GamesWon : stats.team2GamesWon;
  const ganadorGamesLost = esEquipo1Ganador ? stats.team2GamesWon : stats.team1GamesWon;

  const perdedorSetsWon = ganadorSetsLost;
  const perdedorSetsLost = ganadorSetsWon;
  const perdedorGamesWon = ganadorGamesLost;
  const perdedorGamesLost = ganadorGamesWon;

  // Actualizar cada jugador
  const nuevosRatings = [
    eloResult.newTeam1Ratings[0], eloResult.newTeam1Ratings[1],
    eloResult.newTeam2Ratings[0], eloResult.newTeam2Ratings[1],
  ];

  const resultado: JugadorNotificacion[] = [];

  for (let i = 0; i < 4; i++) {
    const userId = todosJugadores[i];
    const statsAnterior = statsActuales[i];
    const nuevoElo = Math.max(100, nuevosRatings[i]);
    const delta = Math.round(nuevoElo - statsAnterior.eloRating);
    const esGanador = esEquipo1Ganador ? i < 2 : i >= 2;

    const nuevaRacha = esGanador ? statsAnterior.winStreak + 1 : 0;

    await tx.playerStats.update({
      where: { id: statsAnterior.id },
      data: {
        eloRating: nuevoElo,
        matchesPlayed: { increment: 1 },
        matchesWon: esGanador ? { increment: 1 } : undefined,
        setsWon: { increment: esGanador ? ganadorSetsWon : perdedorSetsWon },
        setsLost: { increment: esGanador ? ganadorSetsLost : perdedorSetsLost },
        gamesWon: { increment: esGanador ? ganadorGamesWon : perdedorGamesWon },
        gamesLost: { increment: esGanador ? ganadorGamesLost : perdedorGamesLost },
        winStreak: nuevaRacha,
        bestWinStreak: Math.max(statsAnterior.bestWinStreak, nuevaRacha),
      },
    });

    resultado.push({ userId, nuevoElo, delta });
  }

  return resultado;
}

async function revertirPlayerStats(
  tx: Prisma.TransactionClient,
  team1: TeamInfo,
  team2: TeamInfo,
  oldWinnerId: string,
  team1Id: string,
  stats: ParsedStats,
  clubId: string,
): Promise<void> {
  const jugadoresEquipo1 = [team1.player1Id, team1.player2Id];
  const jugadoresEquipo2 = [team2.player1Id, team2.player2Id];
  const todosJugadores = [...jugadoresEquipo1, ...jugadoresEquipo2];

  // Obtener PlayerStats actuales
  const statsActuales = await Promise.all(
    todosJugadores.map(userId =>
      tx.playerStats.findUnique({
        where: { userId_clubId: { userId, clubId } },
      })
    )
  );

  // Si algun jugador no tiene stats, no hay nada que revertir
  if (statsActuales.some(s => !s)) return;

  const [p1t1Stats, p2t1Stats, p1t2Stats, p2t2Stats] = statsActuales as NonNullable<typeof statsActuales[0]>[];

  // Calcular el delta ELO que se aplicaria ahora con el mismo ganador
  const esEquipo1Ganador = oldWinnerId === team1Id;
  const eloResult = calculateMatchRatings({
    team1Ratings: [p1t1Stats.eloRating, p2t1Stats.eloRating],
    team2Ratings: [p1t2Stats.eloRating, p2t2Stats.eloRating],
    winner: esEquipo1Ganador ? 1 : 2,
    gamesPlayedTeam1: [p1t1Stats.matchesPlayed, p2t1Stats.matchesPlayed],
    gamesPlayedTeam2: [p1t2Stats.matchesPlayed, p2t2Stats.matchesPlayed],
  });

  const nuevosRatings = [
    eloResult.newTeam1Ratings[0], eloResult.newTeam1Ratings[1],
    eloResult.newTeam2Ratings[0], eloResult.newTeam2Ratings[1],
  ];

  // Sets/games del equipo ganador/perdedor
  const ganadorSetsWon = esEquipo1Ganador ? stats.team1SetsWon : stats.team2SetsWon;
  const ganadorSetsLost = esEquipo1Ganador ? stats.team2SetsWon : stats.team1SetsWon;
  const ganadorGamesWon = esEquipo1Ganador ? stats.team1GamesWon : stats.team2GamesWon;
  const ganadorGamesLost = esEquipo1Ganador ? stats.team2GamesWon : stats.team1GamesWon;

  const perdedorSetsWon = ganadorSetsLost;
  const perdedorSetsLost = ganadorSetsWon;
  const perdedorGamesWon = ganadorGamesLost;
  const perdedorGamesLost = ganadorGamesWon;

  for (let i = 0; i < 4; i++) {
    const statsAnterior = statsActuales[i]!;
    // Restar el delta que se calcularia ahora
    const delta = nuevosRatings[i] - statsAnterior.eloRating;
    const eloRevertido = Math.max(100, statsAnterior.eloRating - delta);
    const esGanador = esEquipo1Ganador ? i < 2 : i >= 2;

    await tx.playerStats.update({
      where: { id: statsAnterior.id },
      data: {
        eloRating: eloRevertido,
        matchesPlayed: { decrement: 1 },
        matchesWon: esGanador ? { decrement: 1 } : undefined,
        setsWon: { decrement: esGanador ? ganadorSetsWon : perdedorSetsWon },
        setsLost: { decrement: esGanador ? ganadorSetsLost : perdedorSetsLost },
        gamesWon: { decrement: esGanador ? ganadorGamesWon : perdedorGamesWon },
        gamesLost: { decrement: esGanador ? ganadorGamesLost : perdedorGamesLost },
        winStreak: 0, // No reconstruimos racha historica
        // bestWinStreak NO se toca (es maximo historico)
      },
    });
  }
}

// PATCH: Actualizar o eliminar resultado de un partido
export async function PATCH(
  req: Request,
  { params }: { params: { competitionId: string; matchId: string } }
) {
  try {
    const auth = await requireAuth("competitions:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const validacion = validarBody(MatchResultSchema, body);
    if (!validacion.success) return validacion.response;
    const newResult = validacion.data.result;
    const clubId = auth.session.user.clubId;

    // Verificar que la competicion pertenece al club
    const competition = await db.competition.findFirst({
      where: { id: params.competitionId, clubId },
      include: { club: { select: { slug: true } } },
    });
    if (!competition) {
      return new NextResponse("Competición no encontrada.", { status: 404 });
    }

    const match = await db.match.findUnique({
      where: { id: params.matchId },
      include: {
        team1: { select: { player1Id: true, player2Id: true, name: true } },
        team2: { select: { player1Id: true, player2Id: true, name: true } },
      },
    });
    if (!match) { return new NextResponse("Partido no encontrado.", { status: 404 }); }
    if (!match.team1Id || !match.team2Id) { return new NextResponse("Los equipos de este partido no están definidos.", { status: 400 }); }

    const txResult = await db.$transaction(async (tx) => {
      let datosNotificacion: {
        jugadores: JugadorNotificacion[];
        resultado: string;
        equipoGanador: string;
        equipoPerdedor: string;
      } | null = null;

      // 1. Revertir estadisticas antiguas si existian
      if (match.result && match.winnerId) {
        const { sanitizedResult: _, ...oldStats } = parseResult(match.result);
        const oldWinnerId = match.winnerId;
        const oldLoserId = oldWinnerId === match.team1Id ? match.team2Id! : match.team1Id!;

        const oldWinnerStats = { points: 2, played: 1, won: 1, lost: 0, setsFor: oldWinnerId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon, setsAgainst: oldWinnerId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon, gamesFor: oldWinnerId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon, gamesAgainst: oldWinnerId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon };
        const oldLoserStats = { points: 1, played: 1, won: 0, lost: 1, setsFor: oldLoserId === match.team1Id ? oldStats.team1SetsWon : oldStats.team2SetsWon, setsAgainst: oldLoserId === match.team1Id ? oldStats.team2SetsWon : oldStats.team1SetsWon, gamesFor: oldLoserId === match.team1Id ? oldStats.team1GamesWon : oldStats.team2GamesWon, gamesAgainst: oldLoserId === match.team1Id ? oldStats.team2GamesWon : oldStats.team1GamesWon };

        await updateStats(tx, oldWinnerId, oldWinnerStats, 'decrement');
        await updateStats(tx, oldLoserId, oldLoserStats, 'decrement');

        // Revertir ELO de jugadores
        if (match.team1 && match.team2) {
          await revertirPlayerStats(tx, match.team1, match.team2, oldWinnerId, match.team1Id!, oldStats, clubId);
        }

        // Revertir avance en torneo
        if (competition.format === CompetitionFormat.KNOCKOUT) {
          const nextRoundMatches = await tx.match.findMany({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber + 1 } });
          if (nextRoundMatches.length > 0) {
            const currentRoundMatches = await tx.match.findMany({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber }, orderBy: { id: 'asc' } });
            const matchIndex = currentRoundMatches.findIndex(m => m.id === match.id);
            const nextMatch = nextRoundMatches[Math.floor(matchIndex / 2)];
            if (nextMatch?.team1Id === match.winnerId) await tx.match.update({ where: { id: nextMatch.id }, data: { team1Id: null } });
            if (nextMatch?.team2Id === match.winnerId) await tx.match.update({ where: { id: nextMatch.id }, data: { team2Id: null } });
          }
        }
      }

      // 2. Si hay nuevo resultado, aplicarlo
      if (newResult) {
        const { sanitizedResult, ...newStats } = parseResult(newResult);
        const newWinnerId = newStats.team1SetsWon > newStats.team2SetsWon ? match.team1Id! : match.team2Id!;
        const newLoserId = newWinnerId === match.team1Id ? match.team2Id! : match.team1Id!;

        const newWinnerStats = { points: 2, played: 1, won: 1, lost: 0, setsFor: newWinnerId === match.team1Id ? newStats.team1SetsWon : newStats.team2SetsWon, setsAgainst: newWinnerId === match.team1Id ? newStats.team2SetsWon : newStats.team1SetsWon, gamesFor: newWinnerId === match.team1Id ? newStats.team1GamesWon : newStats.team2GamesWon, gamesAgainst: newWinnerId === match.team1Id ? newStats.team2GamesWon : newStats.team1GamesWon };
        const newLoserStats = { points: 1, played: 1, won: 0, lost: 1, setsFor: newLoserId === match.team1Id ? newStats.team1SetsWon : newStats.team2SetsWon, setsAgainst: newLoserId === match.team1Id ? newStats.team2SetsWon : newStats.team1SetsWon, gamesFor: newLoserId === match.team1Id ? newStats.team1GamesWon : newStats.team2GamesWon, gamesAgainst: newLoserId === match.team1Id ? newStats.team2GamesWon : newStats.team1GamesWon };

        await updateStats(tx, newWinnerId, newWinnerStats, 'increment');
        await updateStats(tx, newLoserId, newLoserStats, 'increment');

        // Actualizar ELO de jugadores
        if (match.team1 && match.team2) {
          const jugadores = await actualizarPlayerStats(tx, match.team1, match.team2, newWinnerId, match.team1Id!, newStats, clubId);
          const equipoGanador = newWinnerId === match.team1Id ? match.team1.name : match.team2.name;
          const equipoPerdedor = newWinnerId === match.team1Id ? match.team2.name : match.team1.name;
          datosNotificacion = { jugadores, resultado: sanitizedResult, equipoGanador, equipoPerdedor };
        }

        await tx.match.update({ where: { id: params.matchId }, data: { result: sanitizedResult, winnerId: newWinnerId } });

        if (competition.format === CompetitionFormat.KNOCKOUT) {
          const currentRoundMatches = await tx.match.findMany({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber }, orderBy: { id: 'asc' } });
          const isFinal = (await tx.match.count({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber + 1 } })) === 0;
          if (!isFinal) {
            const matchIndex = currentRoundMatches.findIndex(m => m.id === params.matchId);
            const nextMatchIndex = Math.floor(matchIndex / 2);
            const nextRoundMatches = await tx.match.findMany({ where: { competitionId: params.competitionId, roundNumber: match.roundNumber + 1 }, orderBy: { id: 'asc' } });
            const nextMatch = nextRoundMatches[nextMatchIndex];
            if (nextMatch) {
              const updateData = matchIndex % 2 === 0 ? { team1Id: newWinnerId } : { team2Id: newWinnerId };
              await tx.match.update({ where: { id: nextMatch.id }, data: updateData });
            }
          }
        }
      } else {
        await tx.match.update({ where: { id: params.matchId }, data: { result: null, winnerId: null } });
      }

      return datosNotificacion;
    });

    // Enviar notificaciones fuera de la transaccion (no bloquear respuesta)
    if (txResult) {
      const { jugadores, resultado, equipoGanador, equipoPerdedor } = txResult;
      Promise.allSettled(
        jugadores.map(j =>
          crearNotificacion({
            tipo: "competition_result",
            titulo: "Resultado registrado",
            mensaje: `${equipoGanador} vs ${equipoPerdedor}: ${resultado}. Tu nivel: ${eloANivel(j.nuevoElo).toFixed(1)}`,
            userId: j.userId,
            clubId,
            metadata: { matchId: params.matchId, competitionId: params.competitionId },
            url: `/club/${competition.club.slug}/competiciones/${params.competitionId}`,
          })
        )
      );
    }

    return NextResponse.json({ message: "Resultado actualizado con éxito." });
  } catch (error) {
    console.error("[MATCH_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
