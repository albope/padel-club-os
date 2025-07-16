'use client';

import React from 'react';
import { type MatchWithTeams, type TeamWithPlayers } from '@/types/competition.types';
import { Save, Edit, XCircle, Download, Loader2 } from 'lucide-react';
import ClassificationTable from './ClassificationTable';

interface LeagueViewProps {
  teams: TeamWithPlayers[];
  matches: MatchWithTeams[];
  matchDates: { [matchId: string]: string };
  isLoading: boolean;
  exporting: boolean;
  onDateChange: (matchId: string, date: string) => void;
  onUpdateDates: () => void;
  onOpenResultModal: (match: MatchWithTeams) => void;
  onDeleteResult: (matchId: string) => void;
  onExportImage: (elementId: string, fileName: string) => void;
}

const LeagueView: React.FC<LeagueViewProps> = ({
  teams,
  matches,
  matchDates,
  isLoading,
  exporting,
  onDateChange,
  onUpdateDates,
  onOpenResultModal,
  onDeleteResult,
  onExportImage
}) => {
  const groupedMatches = matches.reduce((acc, match) => {
    const round = match.roundNumber || 0;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, MatchWithTeams[]>);

  const sortedTeams = [...teams].sort((a, b) => {
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
    <>
      <div id="calendario-container" className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-white">Calendario de Jornadas</h2>
          <button onClick={onUpdateDates} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50">
            <Save className="h-4 w-4" /> Guardar Fechas
          </button>
        </div>
        {matches.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedMatches).sort(([a], [b]) => Number(a) - Number(b)).map(([round, roundMatches]) => (
              <div key={round}>
                <h3 className="text-lg font-semibold text-indigo-400 mb-2 border-b border-gray-700 pb-1">{roundMatches[0]?.roundName || `Jornada ${round}`}</h3>
                <ul className="divide-y divide-gray-700">
                  {roundMatches.map(match => (
                    <li key={match.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <p className="font-medium text-white">{match.team1?.name ?? '?'} vs {match.team2?.name ?? '?'}</p>
                        <p className="text-xs text-gray-400 truncate">
                          ({match.team1?.player1?.name ?? 'S/N'} / {match.team1?.player2?.name ?? 'S/N'}) vs ({match.team2?.player1?.name ?? 'S/N'} / {match.team2?.player2?.name ?? 'S/N'})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input type="date" value={matchDates[match.id] || ''} onChange={(e) => onDateChange(match.id, e.target.value)} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm border-gray-600 focus:ring-indigo-500" />
                        <div className="flex items-center rounded-lg bg-indigo-500/20">
                          <button onClick={() => onOpenResultModal(match)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-300 hover:bg-indigo-500/40 rounded-l-lg">
                            <Edit className="h-4 w-4" />
                            <span>{match.result || 'Resultado'}</span>
                          </button>
                          {match.result && (
                            <button onClick={() => onDeleteResult(match.id)} title="Eliminar resultado" disabled={isLoading} className="px-2 py-1.5 text-red-400 hover:bg-red-500/40 rounded-r-lg border-l border-indigo-500/50 disabled:opacity-50">
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 text-center py-12">Genera el calendario para ver los partidos.</p>}
      </div>

      <div id="clasificacion-container" className="bg-gray-800 p-6 rounded-xl shadow-lg mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Clasificación</h2>
          <button onClick={() => onExportImage('clasificacion-container', `clasificacion-${matches[0]?.competitionId}.png`)} disabled={exporting} className="p-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-600" title="Descargar Clasificación como imagen">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </button>
        </div>
        {teams.length > 0 ? (
          <ClassificationTable teams={sortedTeams} />
        ) : <p className="text-gray-500 text-center py-12">La clasificación aparecerá aquí.</p>}
      </div>
    </>
  );
};

export default LeagueView;