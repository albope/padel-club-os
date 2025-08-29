// Path: src/types/competition.types.ts
import type { Competition, Team, Match, User } from '@prisma/client';

// Tipo para un equipo que incluye los nombres de sus jugadores
export type TeamWithPlayers = Team & {
  player1: { name: string | null };
  player2: { name: string | null };
};

// Tipo para un partido que incluye los equipos con sus jugadores
export type MatchWithTeams = Match & {
  team1: TeamWithPlayers | null; // <-- Permite nulos para brackets
  team2: TeamWithPlayers | null; // <-- Permite nulos para brackets
};

// Tipo para una competición que incluye todos sus detalles anidados
export type CompetitionWithDetails = Competition & {
  teams: TeamWithPlayers[];
  matches: MatchWithTeams[];
};
