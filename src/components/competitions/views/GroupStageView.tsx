'use client';

import React, { useMemo } from 'react';
import { Edit } from 'lucide-react';
import { type CompetitionWithDetails, type MatchWithTeams } from '@/types/competition.types';
import ClassificationTable from './ClassificationTable';

interface GroupStageViewProps {
  competition: CompetitionWithDetails;
  onOpenResultModal: (match: MatchWithTeams) => void;
}

const GroupStageView: React.FC<GroupStageViewProps> = ({ competition, onOpenResultModal }) => {
  // Usamos useMemo para agrupar los equipos por su grupo.
  // Esto se recalculará solo si la lista de equipos cambia.
  const groupedTeams = useMemo(() => {
    return competition.teams.reduce((acc, team) => {
      const group = team.group || 'Sin Grupo';
      if (!acc[group]) acc[group] = [];
      acc[group].push(team);
      return acc;
    }, {} as Record<string, typeof competition.teams>);
  }, [competition.teams]);

  return (
    <div className="space-y-8">
      {Object.entries(groupedTeams)
        .sort(([a], [b]) => a.localeCompare(b)) // Ordena los grupos alfabéticamente (Grupo A, Grupo B...)
        .map(([groupName, teamsInGroup]) => {
          // Ordenamos los equipos de este grupo para la tabla de clasificación
          const sortedTeams = [...teamsInGroup].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const setDiffA = a.setsFor - a.setsAgainst;
            const setDiffB = b.setsFor - b.setsAgainst;
            if (setDiffB !== setDiffA) return setDiffB - setDiffA;
            const gameDiffA = a.gamesFor - a.gamesAgainst;
            const gameDiffB = b.gamesFor - b.gamesAgainst;
            if (gameDiffB !== gameDiffA) return gameDiffB - gameDiffA;
            return b.setsFor - a.setsFor;
          });

          return (
            <div key={groupName} className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold text-indigo-400 mb-4">Grupo {groupName}</h3>
              
              {/* Tabla de Clasificación del Grupo */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Clasificación</h4>
                <ClassificationTable teams={sortedTeams} />
              </div>
              
              {/* Lista de Partidos del Grupo */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Partidos del Grupo</h4>
                <ul className="divide-y divide-gray-700">
                  {competition.matches
                    .filter(m => m.roundName?.includes(`Grupo ${groupName}`))
                    .map(match => (
                      <li key={match.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
                         <div className="flex-1 min-w-[200px]">
                            <p className="font-medium text-white">{match.team1?.name ?? '?'} vs {match.team2?.name ?? '?'}</p>
                            <p className="text-xs text-gray-400 truncate">
                                ({match.team1?.player1?.name ?? 'S/N'} / {match.team1?.player2?.name ?? 'S/N'}) vs ({match.team2?.player1?.name ?? 'S/N'} / {match.team2?.player2?.name ?? 'S/N'})
                            </p>
                        </div>
                        <button onClick={() => onOpenResultModal(match)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-300 hover:bg-indigo-500/40 rounded-lg">
                          <Edit className="h-4 w-4" />
                          <span>{match.result || 'Resultado'}</span>
                        </button>
                      </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default GroupStageView;