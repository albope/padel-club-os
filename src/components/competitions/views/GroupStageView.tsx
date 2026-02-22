
'use client';

import React, { useMemo } from 'react';
import { Edit, XCircle } from 'lucide-react';
import { type CompetitionWithDetails, type MatchWithTeams } from '@/types/competition.types';
import ClassificationTable from './ClassificationTable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface GroupStageViewProps {
  competition: CompetitionWithDetails;
  onOpenResultModal: (match: MatchWithTeams) => void;
  onDeleteResult: (matchId: string) => void;
  isLoading: boolean;
}

const GroupStageView: React.FC<GroupStageViewProps> = ({ competition, onOpenResultModal, onDeleteResult, isLoading }) => {
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
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([groupName, teamsInGroup]) => {
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
            <Card key={groupName} className="p-6">
              <h3 className="text-2xl font-bold text-primary mb-4">Grupo {groupName}</h3>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Clasificacion</h4>
                <ClassificationTable teams={sortedTeams} />
              </div>

              <Separator className="my-4" />

              <div>
                <h4 className="text-lg font-semibold mb-2">Partidos del Grupo</h4>
                <ul className="divide-y divide-border">
                  {competition.matches
                    .filter(m => m.roundName?.includes(`Grupo ${groupName}`))
                    .map(match => (
                      <li key={match.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
                        <div className="flex-1 min-w-[200px]">
                          <p className="font-medium">{match.team1?.name ?? '?'} vs {match.team2?.name ?? '?'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            ({match.team1?.player1?.name ?? 'S/N'} / {match.team1?.player2?.name ?? 'S/N'}) vs ({match.team2?.player1?.name ?? 'S/N'} / {match.team2?.player2?.name ?? 'S/N'})
                          </p>
                        </div>
                        <div className="flex items-center rounded-lg bg-primary/10">
                          <button onClick={() => onOpenResultModal(match)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/20 rounded-l-lg">
                            <Edit className="h-4 w-4" />
                            <span>{match.result || 'Resultado'}</span>
                          </button>
                          {match.result && (
                            <button onClick={() => onDeleteResult(match.id)} title="Eliminar resultado" disabled={isLoading} className="px-2 py-1.5 text-destructive hover:bg-destructive/20 rounded-r-lg border-l border-primary/20 disabled:opacity-50">
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </li>
                  ))}
                </ul>
              </div>
            </Card>
          );
        })}
    </div>
  );
};

export default GroupStageView;
