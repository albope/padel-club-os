'use client';

import React, { useState, useEffect } from 'react';
import { User, CompetitionFormat } from '@prisma/client';
import { PlusCircle, Zap, Loader2, Pencil, Save, Edit, XCircle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useRouter } from 'next/navigation';

import {
  type CompetitionWithDetails,
  type TeamWithPlayers,
  type MatchWithTeams,
} from '@/types/competition.types';

import AddTeamModal from './AddTeamModal';
import AddResultModal from './AddResultModal';
import BracketView from './BracketView';

interface CompetitionDetailClientProps {
  competition: CompetitionWithDetails;
  users: User[];
}

const CompetitionDetailClient: React.FC<CompetitionDetailClientProps> = ({ competition, users }) => {
  const router = useRouter();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithPlayers | null>(null);
  const [editingMatch, setEditingMatch] = useState<MatchWithTeams | null>(null);
  const [matchDates, setMatchDates] = useState<{ [matchId: string]: string }>({});

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

  const handleGenerateMatches = async () => {
    const confirmationMessage = `Esto eliminará todos los partidos existentes y generará un nuevo ${
      competition.format === 'KNOCKOUT' ? 'cuadro eliminatorio' : 'calendario de liga'
    }. ¿Continuar?`;

    if (!window.confirm(confirmationMessage)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/competitions/${competition.id}/generate-matches`, {
        method: 'POST',
      });
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
      const response = await fetch(`/api/competitions/${competition.id}/matches`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchesToUpdate }),
      });
      if (!response.ok) throw new Error("No se pudieron guardar las fechas.");
      alert("Fechas guardadas con éxito.");
      router.refresh();
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
      const response = await fetch(`/api/competitions/${competition.id}/matches/${matchId}`, {
        method: 'DELETE',
      });
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

  const LeagueView = () => {
    const groupedMatches = competition.matches.reduce((acc, match) => {
      const round = match.roundNumber || 0;
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {} as Record<number, MatchWithTeams[]>);
    
    const sortedTeams = [...competition.teams].sort((a, b) => {
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
              <button onClick={handleUpdateMatchDates} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50">
                  <Save className="h-4 w-4" />
                  Guardar Fechas
              </button>
          </div>
          {competition.matches.length > 0 ? (
             <div className="space-y-6">
               {Object.entries(groupedMatches).sort(([a], [b]) => Number(a) - Number(b)).map(([round, matches]) => (
                 <div key={round}>
                   <h3 className="text-lg font-semibold text-indigo-400 mb-2 border-b border-gray-700 pb-1">{matches[0]?.roundName || `Jornada ${round}`}</h3>
                   <ul className="divide-y divide-gray-700">
                     {matches.map(match => (
                       <li key={match.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
                         <p className="text-white flex-1 min-w-[150px]">{match.team1.name} vs {match.team2.name}</p>
                         <div className="flex items-center gap-2 flex-wrap">
                            <input type="date" value={matchDates[match.id] || ''} onChange={(e) => handleDateChange(match.id, e.target.value)} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm border-gray-600 focus:ring-indigo-500" />
                            <div className="flex items-center rounded-lg bg-indigo-500/20">
                               <button onClick={() => handleOpenResultModal(match)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-300 hover:bg-indigo-500/40 rounded-l-lg">
                                 <Edit className="h-4 w-4" />
                                 <span>{match.result || 'Resultado'}</span>
                               </button>
                               {match.result && (
                                 <button onClick={() => handleDeleteResult(match.id)} title="Eliminar resultado" disabled={isLoading} className="px-2 py-1.5 text-red-400 hover:bg-red-500/40 rounded-r-lg border-l border-indigo-500/50 disabled:opacity-50">
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
        <div id="clasificacion-container" className="bg-gray-800 p-6 rounded-xl shadow-lg">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-semibold text-white">Clasificación</h2>
             <button onClick={() => handleExportAsImage('clasificacion-container', `clasificacion-${competition.name.replace(/\s+/g, '_')}.png`)} disabled={exporting} className="p-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-600" title="Descargar Clasificación como imagen">
               {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
             </button>
           </div>
           {competition.teams.length > 0 ? (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                   <tr>
                     <th className="px-4 py-3">Equipo</th>
                     <th className="px-2 py-3 text-center" title="Partidos Jugados">PJ</th>
                     <th className="px-2 py-3 text-center" title="Partidos Ganados">PG</th>
                     <th className="px-2 py-3 text-center" title="Partidos Perdidos">PP</th>
                     <th className="px-2 py-3 text-center" title="Puntos">Ptos</th>
                   </tr>
                 </thead>
                 <tbody>
                   {sortedTeams.map(team => (
                     <tr key={team.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                       <td className="px-4 py-3 font-medium text-white">{team.name}</td>
                       <td className="px-2 py-3 text-center">{team.played}</td>
                       <td className="px-2 py-3 text-center text-green-400">{team.won}</td>
                       <td className="px-2 py-3 text-center text-red-400">{team.lost}</td>
                       <td className="px-2 py-3 text-center font-bold text-lg text-indigo-400">{team.points}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           ) : <p className="text-gray-500 text-center py-12">La clasificación aparecerá aquí.</p>}
        </div>
      </>
    );
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
                  <p className="font-medium text-white">{team.name}</p>
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
                {competition.format === CompetitionFormat.KNOCKOUT ? 'Generar Bracket' : 'Generar Calendario'}
            </button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
        {competition.format === CompetitionFormat.LEAGUE && <LeagueView />}
        {competition.format === CompetitionFormat.KNOCKOUT && <BracketView matches={competition.matches} onMatchClick={handleOpenResultModal} />}
        {competition.format === CompetitionFormat.GROUP_AND_KNOCKOUT && <p className="text-gray-400 p-6 bg-gray-800 rounded-lg">La vista para fase de grupos y eliminatorias se implementará próximamente.</p>}
      </div>
    </>
  );
};

export default CompetitionDetailClient;