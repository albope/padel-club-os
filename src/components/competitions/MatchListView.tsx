'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import { type MatchWithTeams } from '@/types/competition.types';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface MatchListViewProps {
  matches: MatchWithTeams[];
  onMatchClick: (match: MatchWithTeams) => void;
}

const MatchCard: React.FC<{ match: MatchWithTeams; onMatchClick: (match: MatchWithTeams) => void; }> = ({ match, onMatchClick }) => {
  const canEdit = match.team1 && match.team2 && match.result !== 'BYE';

  const winnerStyle = "font-bold";
  const loserStyle = "text-muted-foreground";

  const getTeamStyle = (teamId: string | null) => {
    if (!match.winnerId || match.result === 'BYE') return '';
    return match.winnerId === teamId ? winnerStyle : loserStyle;
  };

  const sets = match.result && match.result !== 'BYE'
    ? match.result.split(' ').map(s => s.split('-'))
    : [];

  return (
    <div className="relative group">
      <Card
        onClick={() => canEdit && onMatchClick(match)}
        className={`p-3 ${canEdit ? 'cursor-pointer hover:border-primary/50' : 'cursor-default'}`}
      >
        {/* Equipo 1 */}
        <div className="flex justify-between items-center">
          <p className={`font-medium truncate ${getTeamStyle(match.team1Id)}`}>
            {match.team1?.name ?? 'Por determinar'}
          </p>
          <div className="flex items-center font-mono text-lg">
            {sets.map((set, index) => (
              <span key={index} className={`w-8 text-center ${set[0] > set[1] ? 'font-bold' : 'text-muted-foreground'}`}>
                {set[0] ?? ''}
              </span>
            ))}
          </div>
        </div>

        <Separator className="my-2" />

        {/* Equipo 2 */}
        <div className="flex justify-between items-center">
          <p className={`font-medium truncate ${getTeamStyle(match.team2Id)}`}>
            {match.team2?.name ?? 'Por determinar'}
          </p>
          <div className="flex items-center font-mono text-lg">
            {sets.map((set, index) => (
              <span key={index} className={`w-8 text-center ${set[1] > set[0] ? 'font-bold' : 'text-muted-foreground'}`}>
                {set[1] ?? ''}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {canEdit && (
        <button
          onClick={() => onMatchClick(match)}
          className="absolute top-1/2 -right-3 -translate-y-1/2 p-1.5 bg-primary rounded-full text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          title="Editar resultado"
        >
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
    <div className="flex gap-8 overflow-x-auto pb-4 -mx-6 px-6">
      {Object.entries(rounds)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([roundNumber, roundMatches]) => (
          <div key={roundNumber} className="flex flex-col gap-6 flex-shrink-0 w-72">
            <h3 className="text-2xl font-bold text-primary text-center">
              {roundMatches[0]?.roundName || `Ronda ${roundNumber}`}
            </h3>
            <div className="space-y-6">
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
