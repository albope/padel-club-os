'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import { type MatchWithTeams } from '@/types/competition.types';

interface BracketViewProps {
  matches: MatchWithTeams[];
  onMatchClick: (match: MatchWithTeams) => void;
}

const BracketView: React.FC<BracketViewProps> = ({ matches, onMatchClick }) => {
  const rounds = matches.reduce((acc, match) => {
    const round = match.roundNumber;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, MatchWithTeams[]>);

  return (
    <div className="flex space-x-4 overflow-x-auto p-4 bg-gray-900 rounded-lg">
      {Object.entries(rounds)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([roundNumber, roundMatches]) => (
          <div key={roundNumber} className="flex flex-col justify-around space-y-8 min-w-[280px]">
            <h3 className="text-xl font-bold text-indigo-400 text-center">
              {roundMatches[0]?.roundName || `Ronda ${roundNumber}`}
            </h3>
            <div className="space-y-4">
              {roundMatches.map((match) => {
                // --- CORRECCIÓN ---: Comprobaciones para manejar equipos nulos
                const team1Name = match.team1?.name ?? "Por determinar";
                const team2Name = match.team2?.name ?? "Por determinar";
                const canEdit = match.team1 && match.team2;

                return (
                  <div key={match.id} className="relative">
                    <div
                      onClick={() => canEdit && onMatchClick(match)}
                      className={`bg-gray-800 p-3 rounded-lg border border-gray-700 ${canEdit ? 'cursor-pointer hover:bg-gray-700/50' : 'cursor-default'}`}
                    >
                      <div className={`flex justify-between items-center ${match.winnerId === match.team1Id ? 'font-bold text-white' : 'text-gray-400'}`}>
                        <span>{team1Name}</span>
                        <span className="font-mono">{match.result?.split(',')[0]?.split('-')[0] ?? ''}</span>
                      </div>
                      <div className="my-2 border-t border-dashed border-gray-600"></div>
                      <div className={`flex justify-between items-center ${match.winnerId === match.team2Id ? 'font-bold text-white' : 'text-gray-400'}`}>
                        <span>{team2Name}</span>
                        <span className="font-mono">{match.result?.split(',')[0]?.split('-')[1] ?? ''}</span>
                      </div>
                    </div>
                    {canEdit && (
                       <button onClick={() => onMatchClick(match)} className="absolute top-1/2 -right-3 -translate-y-1/2 p-1 bg-gray-600 rounded-full text-white hover:bg-indigo-600">
                        <Edit size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
};

export default BracketView;