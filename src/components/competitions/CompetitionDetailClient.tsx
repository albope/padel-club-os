'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type CompetitionWithDetails, type MatchWithTeams, type TeamWithPlayers } from '@/types/competition.types';
import { User, CompetitionStatus, CompetitionFormat } from '@prisma/client';
import { PlusCircle, Zap, Loader2, Pencil, Trash2, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

import AddTeamModal from './AddTeamModal';
import AddResultModal from './AddResultModal';
import LeagueView from './views/LeagueView';
import GroupStageView from './views/GroupStageView';
import MatchListView from './MatchListView';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

interface CompetitionDetailClientProps {
  competition: CompetitionWithDetails;
  users: User[];
}

const CompetitionDetailClient: React.FC<CompetitionDetailClientProps> = ({ competition: initialCompetition, users }) => {
  const router = useRouter();
  const [competition, setCompetition] = useState(initialCompetition);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithPlayers | null>(null);
  const [editingMatch, setEditingMatch] = useState<MatchWithTeams | null>(null);
  const [matchDates, setMatchDates] = useState<{ [matchId: string]: string }>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    destructive: boolean;
    action: () => Promise<void>;
  }>({ open: false, title: '', description: '', destructive: false, action: async () => {} });

  useEffect(() => {
    setCompetition(initialCompetition);
    const initialDates: { [matchId: string]: string } = {};
    initialCompetition.matches.forEach(match => {
      if (match.matchDate) {
        initialDates[match.id] = new Date(match.matchDate).toISOString().split('T')[0];
      }
    });
    setMatchDates(initialDates);
  }, [initialCompetition]);

  const handleDateChange = (matchId: string, date: string) => {
    setMatchDates(prev => ({ ...prev, [matchId]: date }));
  };

  const handleOpenTeamModal = (team: TeamWithPlayers | null = null) => {
    setEditingTeam(team);
    setIsTeamModalOpen(true);
  };

  const handleOpenResultModal = (match: MatchWithTeams) => {
    setEditingMatch(match);
    setIsResultModalOpen(true);
  };

  const getButtonText = () => {
    switch (competition.format) {
      case CompetitionFormat.KNOCKOUT: return 'Generar Bracket';
      case CompetitionFormat.GROUP_AND_KNOCKOUT: return 'Generar Fase de Grupos';
      default: return 'Generar Calendario';
    }
  };

  const showConfirm = (title: string, description: string, action: () => Promise<void>, destructive = false) => {
    setConfirmDialog({ open: true, title, description, destructive, action });
  };

  const handleGenerateMatches = async () => {
    showConfirm(
      'Generar partidos',
      '¿Seguro? Se borrarán los partidos existentes y se resetearán las estadísticas.',
      async () => {
        setIsLoading(true);
        try {
          await fetch(`/api/competitions/${competition.id}/generate-matches`, { method: 'POST' });
          toast({ title: "Partidos generados", description: "Los partidos se han generado correctamente." });
          router.refresh();
        } catch (error) {
          console.error(error);
          toast({ title: "Error", description: "Error al generar los partidos.", variant: "destructive" });
        } finally { setIsLoading(false); }
      }
    );
  };

  const handleUpdateMatchDates = async () => { /* ... */ };

  const handleDeleteResult = async (matchId: string) => {
    showConfirm(
      'Eliminar resultado',
      '¿Seguro que quieres eliminar este resultado?',
      async () => {
        setIsLoading(true);
        try {
          await fetch(`/api/competitions/${competition.id}/matches/${matchId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result: null }),
          });
          toast({ title: "Resultado eliminado", description: "El resultado ha sido eliminado." });
          router.refresh();
        } catch (error) {
          console.error(error);
          toast({ title: "Error", description: "Error al eliminar el resultado.", variant: "destructive" });
        } finally { setIsLoading(false); }
      },
      true
    );
  };

  const handleExportAsImage = async (elementId: string, fileName: string) => { /* ... */ };

  const handleFinishCompetition = async () => {
    showConfirm(
      'Finalizar competición',
      '¿Marcar esta competición como finalizada?',
      async () => {
        setIsLoading(true);
        try {
          await fetch(`/api/competitions/${competition.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: CompetitionStatus.FINISHED })
          });
          toast({ title: "Competición finalizada", description: "La competición se ha marcado como finalizada." });
          router.push('/dashboard/competitions');
          router.refresh();
        } catch (error) {
          console.error(error);
          toast({ title: "Error", description: "Error al finalizar la competición.", variant: "destructive" });
        } finally { setIsLoading(false); }
      }
    );
  };

  const handleDeleteCompetition = async () => {
    showConfirm(
      'Eliminar competición',
      '¡ATENCIÓN! Se eliminará la competición y todos sus datos. Esta acción no se puede deshacer. ¿Continuar?',
      async () => {
        setIsLoading(true);
        try {
          await fetch(`/api/competitions/${competition.id}`, { method: 'DELETE' });
          toast({ title: "Competición eliminada", description: "La competición ha sido eliminada." });
          router.push('/dashboard/competitions');
          router.refresh();
        } catch (error) {
          console.error(error);
          toast({ title: "Error", description: "Error al eliminar la competición.", variant: "destructive" });
        } finally { setIsLoading(false); }
      },
      true
    );
  };

  const renderCompetitionView = () => {
    switch (competition.format) {
      case CompetitionFormat.LEAGUE:
        return <LeagueView teams={competition.teams} matches={competition.matches} matchDates={matchDates} isLoading={isLoading} exporting={exporting} onDateChange={handleDateChange} onUpdateDates={handleUpdateMatchDates} onOpenResultModal={handleOpenResultModal} onDeleteResult={handleDeleteResult} onExportImage={handleExportAsImage} />;
      case CompetitionFormat.KNOCKOUT:
        return <MatchListView matches={competition.matches} onMatchClick={handleOpenResultModal} />;
      case CompetitionFormat.GROUP_AND_KNOCKOUT:
        if (competition.matches.length > 0) {
          return <GroupStageView competition={competition} onOpenResultModal={handleOpenResultModal} onDeleteResult={handleDeleteResult} isLoading={isLoading} />;
        }
        return (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Genera la fase de grupos para ver los partidos y la clasificación.</p>
            </CardContent>
          </Card>
        );
      default: return null;
    }
  };

  return (
    <>
      <AddTeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} competitionId={competition.id} users={users} teamToEdit={editingTeam} />
      {editingMatch && <AddResultModal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} match={editingMatch} />}

      <Card className="lg:col-span-1 self-start">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Equipos</CardTitle>
          <Button size="sm" onClick={() => handleOpenTeamModal(null)} disabled={competition.status === 'FINISHED'}>
            <PlusCircle className="mr-1 h-4 w-4" /> Añadir
          </Button>
        </CardHeader>
        <CardContent>
          {competition.teams.length > 0 ? (
            <ul className="space-y-1">
              {competition.teams.map((team, index) => (
                <React.Fragment key={team.id}>
                  {index > 0 && <Separator />}
                  <li className="py-3 flex justify-between items-center group">
                    <div>
                      <p className="font-medium text-foreground">{team.name} {team.group ? `(G${team.group})` : ''}</p>
                      <p className="text-sm text-muted-foreground">{team.player1.name} / {team.player2.name}</p>
                    </div>
                    {competition.status === 'ACTIVE' && (
                      <Button variant="ghost" size="icon" onClick={() => handleOpenTeamModal(team)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-8">Aún no hay equipos.</p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t pt-4">
          {competition.status === 'ACTIVE' && (
            <>
              <Button className="w-full bg-green-600 hover:bg-green-500 text-white" onClick={handleGenerateMatches} disabled={isLoading || competition.teams.length < 2}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                {isLoading ? 'Generando...' : getButtonText()}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleFinishCompetition} disabled={isLoading}>
                <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Competición
              </Button>
            </>
          )}
          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleDeleteCompetition} disabled={isLoading}>
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar Competición
          </Button>
        </CardFooter>
      </Card>

      <div className="lg:col-span-2 space-y-8">
        {renderCompetitionView()}
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await confirmDialog.action();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
              className={confirmDialog.destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CompetitionDetailClient;
