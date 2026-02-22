'use client';

import React from 'react';
import { type MatchWithTeams, type TeamWithPlayers } from '@/types/competition.types';
import { Save, Edit, XCircle, Download, Loader2 } from 'lucide-react';
import ClassificationTable from './ClassificationTable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      <Card id="calendario-container" className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">Calendario de Jornadas</h2>
          <Button onClick={onUpdateDates} disabled={isLoading} size="sm">
            <Save className="h-4 w-4" /> Guardar Fechas
          </Button>
        </div>
        {matches.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedMatches).sort(([a], [b]) => Number(a) - Number(b)).map(([round, roundMatches]) => (
              <div key={round}>
                <h3 className="text-lg font-semibold text-primary mb-2 border-b border-border pb-1">{roundMatches[0]?.roundName || `Jornada ${round}`}</h3>
                <ul className="divide-y divide-border">
                  {roundMatches.map(match => (
                    <li key={match.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <p className="font-medium">{match.team1?.name ?? '?'} vs {match.team2?.name ?? '?'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          ({match.team1?.player1?.name ?? 'S/N'} / {match.team1?.player2?.name ?? 'S/N'}) vs ({match.team2?.player1?.name ?? 'S/N'} / {match.team2?.player2?.name ?? 'S/N'})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input type="date" value={matchDates[match.id] || ''} onChange={(e) => onDateChange(match.id, e.target.value)} className="w-auto h-8 text-sm" />
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
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-center py-12">Genera el calendario para ver los partidos.</p>}
      </Card>

      <Card id="clasificacion-container" className="p-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Clasificacion</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onExportImage('clasificacion-container', `clasificacion-${matches[0]?.competitionId}.png`)}
            disabled={exporting}
            title="Descargar Clasificacion como imagen"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>
        </div>
        {teams.length > 0 ? (
          <ClassificationTable teams={sortedTeams} />
        ) : <p className="text-muted-foreground text-center py-12">La clasificacion aparecera aqui.</p>}
      </Card>
    </>
  );
};

export default LeagueView;
