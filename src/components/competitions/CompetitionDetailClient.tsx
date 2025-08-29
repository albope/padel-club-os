// Path: src/components/competitions/CompetitionDetailClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type CompetitionWithDetails, type MatchWithTeams, type TeamWithPlayers } from '@/types/competition.types';
import { User, CompetitionStatus, CompetitionFormat } from '@prisma/client';
import { PlusCircle, Zap, Loader2, Pencil, Trash2, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

// Modales y Vistas
import AddTeamModal from './AddTeamModal';
import AddResultModal from './AddResultModal';
import LeagueView from './views/LeagueView';
import GroupStageView from './views/GroupStageView';
import MatchListView from './MatchListView';


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

  const handleGenerateMatches = async () => {
    if (!window.confirm("¿Seguro? Se borrarán los partidos existentes y se resetearán las estadísticas.")) return;
    setIsLoading(true);
    try {
      await fetch(`/api/competitions/${competition.id}/generate-matches`, { method: 'POST' });
      router.refresh();
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };
  
  const handleUpdateMatchDates = async () => { /* ... */ };

  const handleDeleteResult = async (matchId: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar este resultado?")) return;
    setIsLoading(true);
    try {
      await fetch(`/api/competitions/${competition.id}/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: null }),
      });
      router.refresh();
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleExportAsImage = async (elementId: string, fileName: string) => { /* ... */ };
  
  // --- NUEVAS ACCIONES DE GESTIÓN ---
  const handleFinishCompetition = async () => {
    if (!window.confirm("¿Marcar esta competición como finalizada?")) return;
    setIsLoading(true);
    try {
        await fetch(`/api/competitions/${competition.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: CompetitionStatus.FINISHED })
        });
        router.push('/dashboard/competitions');
        router.refresh();
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleDeleteCompetition = async () => {
    if (!window.confirm("¡ATENCIÓN! Se eliminará la competición y todos sus datos. Esta acción no se puede deshacer. ¿Continuar?")) return;
    setIsLoading(true);
    try {
        await fetch(`/api/competitions/${competition.id}`, { method: 'DELETE' });
        router.push('/dashboard/competitions');
        router.refresh();
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
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
        return <div className="text-center p-8 bg-gray-800 rounded-lg"><p className="text-gray-400">Genera la fase de grupos para ver los partidos y la clasificación.</p></div>;
      default: return null;
    }
  };

  return (
    <>
      <AddTeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} competitionId={competition.id} users={users} teamToEdit={editingTeam} />
      {editingMatch && <AddResultModal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} match={editingMatch} />}

      <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl shadow-lg self-start">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Equipos</h2>
          <button onClick={() => handleOpenTeamModal(null)} disabled={competition.status === 'FINISHED'} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-600"><PlusCircle className="h-4 w-4" />Añadir</button>
        </div>
        {competition.teams.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {competition.teams.map(team => (
              <li key={team.id} className="py-3 flex justify-between items-center group">
                <div>
                  <p className="font-medium text-white">{team.name} {team.group ? `(G${team.group})` : ''}</p>
                  <p className="text-sm text-gray-400">{team.player1.name} / {team.player2.name}</p>
                </div>
                {competition.status === 'ACTIVE' && (
                  <button onClick={() => handleOpenTeamModal(team)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"><Pencil className="h-4 w-4" /></button>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="text-gray-500 text-center py-8">Aún no hay equipos.</p>}
        
        {/* --- MODIFICADO: Lógica de botones de acción --- */}
        <div className="mt-6 border-t border-gray-700 pt-4 space-y-2">
            {competition.status === 'ACTIVE' && (
                <>
                    <button onClick={handleGenerateMatches} disabled={isLoading || competition.teams.length < 2} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:bg-gray-600">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        {isLoading ? 'Generando...' : getButtonText()}
                    </button>
                    <button onClick={handleFinishCompetition} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-600">
                        <CheckCircle className="h-4 w-4" /> Finalizar Competición
                    </button>
                </>
            )}
            <button onClick={handleDeleteCompetition} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:bg-gray-600">
                <Trash2 className="h-4 w-4" /> Eliminar Competición
            </button>
        </div>

      </div>

      <div className="lg:col-span-2 space-y-8">
        {renderCompetitionView()}
      </div>
    </>
  );
};

export default CompetitionDetailClient;