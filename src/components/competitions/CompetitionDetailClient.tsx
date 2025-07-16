'use client';

import React, { useState, useEffect } from 'react';
import { User, CompetitionFormat } from '@prisma/client';
import { PlusCircle, Zap, Loader2, Pencil } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useRouter } from 'next/navigation';

// Tipos y Modales
import {
  type CompetitionWithDetails,
  type TeamWithPlayers,
  type MatchWithTeams,
} from '@/types/competition.types';
import AddTeamModal from './AddTeamModal';
import AddResultModal from './AddResultModal';

// Vistas Refactorizadas
import LeagueView from './views/LeagueView';
import GroupStageView from './views/GroupStageView';
import MatchListView from './MatchListView';


interface CompetitionDetailClientProps {
  competition: CompetitionWithDetails;
  users: User[];
}

const CompetitionDetailClient: React.FC<CompetitionDetailClientProps> = ({ competition, users }) => {
  const router = useRouter();
  
  // --- GESTIÓN DE ESTADO CENTRALIZADA ---
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithPlayers | null>(null);
  const [editingMatch, setEditingMatch] = useState<MatchWithTeams | null>(null);
  const [matchDates, setMatchDates] = useState<{ [matchId: string]: string }>({});

  // --- LÓGICA Y HANDLERS COMPLETOS ---
  useEffect(() => {
    const initialDates: { [matchId: string]: string } = {};
    competition.matches.forEach(match => {
      if (match.matchDate) {
        initialDates[match.id] = new Date(match.matchDate).toISOString().split('T')[0];
      }
    });
    setMatchDates(initialDates);
  }, [competition.matches]);

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
    const confirmationMessage = `Esto eliminará todos los partidos y reseteará la clasificación. ¿Continuar?`;
    if (!window.confirm(confirmationMessage)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/competitions/${competition.id}/generate-matches`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo generar la competición.");
      }
      router.refresh();
    } catch (error: any) {
      alert(`Error al generar los partidos: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateMatchDates = async () => {
    setIsLoading(true);
    const matchesToUpdate = Object.entries(matchDates).map(([id, matchDate]) => ({ id, matchDate }));
    try {
      // NOTA: La API para esto no está implementada en el contexto original, pero la lógica del cliente está aquí.
      // Deberías tener un endpoint como `/api/competitions/${competition.id}/matches` que acepte un PATCH.
      alert("Lógica para guardar fechas pendiente de implementación en API.");
    } catch (error) {
      alert("Error al guardar las fechas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResult = async (matchId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este resultado?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/competitions/${competition.id}/matches/${matchId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo eliminar el resultado.");
      }
      alert("Resultado eliminado con éxito.");
      router.refresh();
    } catch (error: any) {
      alert(`Error al eliminar el resultado: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAsImage = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(element, { backgroundColor: '#1f2937', scale: 2 });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Hubo un error al generar la imagen.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <AddTeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} competitionId={competition.id} users={users} teamToEdit={editingTeam} />
      {editingMatch && <AddResultModal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} match={editingMatch} />}

      <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl shadow-lg self-start">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Equipos</h2>
          <button onClick={() => handleOpenTeamModal(null)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"><PlusCircle className="h-4 w-4" />Añadir</button>
        </div>
        {competition.teams.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {competition.teams.map(team => (
              <li key={team.id} className="py-3 flex justify-between items-center group">
                <div>
                  <p className="font-medium text-white">{team.name} {team.group ? `(G${team.group})` : ''}</p>
                  <p className="text-sm text-gray-400">{team.player1.name} / {team.player2.name}</p>
                </div>
                <button onClick={() => handleOpenTeamModal(team)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"><Pencil className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        ) : <p className="text-gray-500 text-center py-8">Aún no hay equipos.</p>}
        <div className="mt-6 border-t border-gray-700 pt-4">
          <button onClick={handleGenerateMatches} disabled={isLoading || competition.teams.length < 2} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:bg-gray-600">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {isLoading ? 'Generando...' : getButtonText()}
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
        {competition.format === CompetitionFormat.LEAGUE && 
          <LeagueView 
            teams={competition.teams}
            matches={competition.matches}
            matchDates={matchDates}
            isLoading={isLoading}
            exporting={exporting}
            onDateChange={handleDateChange}
            onUpdateDates={handleUpdateMatchDates}
            onOpenResultModal={handleOpenResultModal}
            onDeleteResult={handleDeleteResult}
            onExportImage={handleExportAsImage}
          />
        }
        {competition.format === CompetitionFormat.KNOCKOUT &&
          <MatchListView matches={competition.matches} onMatchClick={handleOpenResultModal} />
        }
        {competition.format === CompetitionFormat.GROUP_AND_KNOCKOUT && (
          competition.matches.length > 0
            ? <GroupStageView competition={competition} onOpenResultModal={handleOpenResultModal} />
            : <div className="text-center p-8 bg-gray-800 rounded-lg"><p className="text-gray-400">Genera la fase de grupos para ver los partidos y la clasificación.</p></div>
        )}
      </div>
    </>
  );
};

export default CompetitionDetailClient;