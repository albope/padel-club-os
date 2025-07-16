'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import { type MatchWithTeams } from '@/types/competition.types';

interface MatchListViewProps {
  matches: MatchWithTeams[];
  onMatchClick: (match: MatchWithTeams) => void;
}

const MatchCard: React.FC<{ match: MatchWithTeams; onMatchClick: (match: MatchWithTeams) => void; }> = ({ match, onMatchClick }) => {
  const canEdit = match.team1 && match.team2 && match.result !== 'BYE';

  const winnerStyle = "font-bold text-white";
  const loserStyle = "text-gray-500 line-through";
  const getTeamStyle = (teamId: string | null) => {
    if (!match.winnerId) return 'text-gray-300';
    return match.winnerId === teamId ? winnerStyle : loserStyle;
  };
  
  // --- RESTAURADO: Volvemos a usar los datos reales del partido ---
  const sets = match.result && match.result !== 'BYE'
    ? match.result.split(',').map((s) => s.trim().split('-'))
    : [];

  return (
    <div className="relative">
      <div
        onClick={() => canEdit && onMatchClick(match)}
        className={`bg-gray-800 p-3 rounded-lg border border-gray-700 ${canEdit ? 'cursor-pointer hover:bg-gray-700/50' : 'cursor-default'}`}
      >
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              <td className={`w-auto truncate pr-2 ${getTeamStyle(match.team1Id)}`}>
                {match.team1?.name ?? 'Por determinar'}
              </td>
              <td className={`w-8 text-center font-mono text-lg ${getTeamStyle(match.team1Id)}`}>
                {sets[0]?.[0] ?? ''}
              </td>
              <td className={`w-8 text-center font-mono text-lg ${getTeamStyle(match.team1Id)}`}>
                {sets[1]?.[0] ?? ''}
              </td>
              <td className={`w-8 text-center font-mono text-lg ${getTeamStyle(match.team1Id)}`}>
                {sets[2]?.[0] ?? ''}
              </td>
            </tr>

            <tr className="h-2">
                <td colSpan={4} className="border-b border-dashed border-gray-600 p-0"></td>
            </tr>

            <tr>
              <td className={`w-auto truncate pr-2 ${getTeamStyle(match.team2Id)}`}>
                {match.team2?.name ?? 'Por determinar'}
              </td>
              <td className={`w-8 text-center font-mono text-lg ${getTeamStyle(match.team2Id)}`}>
                {sets[0]?.[1] ?? ''}
              </td>
              <td className={`w-8 text-center font-mono text-lg ${getTeamStyle(match.team2Id)}`}>
                {sets[1]?.[1] ?? ''}
              </td>
              <td className={`w-8 text-center font-mono text-lg ${getTeamStyle(match.team2Id)}`}>
                {sets[2]?.[1] ?? ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {canEdit && (
        <button onClick={() => onMatchClick(match)} className="absolute top-1/2 -right-3 -translate-y-1/2 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 shadow-lg">
          <Edit size={14} />
        </button>
      )}
    </div>
  );
};


const MatchListView: React.FC<MatchListViewProps> = ({ matches, onMatchClick }) => {
  const rounds = matches.reduce((acc, match) => {
    const round = match.roundNumber;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, MatchWithTeams[]>);

  return (
    <div className="space-y-8 w-full max-w-2xl mx-auto">
      {Object.entries(rounds)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([roundNumber, roundMatches]) => (
          <div key={roundNumber}>
            <h3 className="text-2xl font-bold text-indigo-400 mb-4 text-center sm:text-left">
              {roundMatches[0]?.roundName || `Ronda ${roundNumber}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roundMatches.map((match) => (
                <MatchCard key={match.id} match={match} onMatchClick={onMatchClick} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default MatchListView;