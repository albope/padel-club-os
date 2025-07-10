'use client';

import React, { useState, useEffect } from 'react';
import { League, Team, User, Match } from '@prisma/client';
import { PlusCircle, Zap, Loader2, Pencil, Save, Edit } from 'lucide-react';
import AddTeamModal from './AddTeamModal';
import AddResultModal from './AddResultModal';
import { useRouter } from 'next/navigation';

// Define the shape of the props
type TeamWithPlayers = Team & { player1: { name: string | null }; player2: { name: string | null } };
type MatchWithTeams = Match & { team1: { name: string | null }; team2: { name: string | null } };
type LeagueWithDetails = League & { teams: TeamWithPlayers[], matches: MatchWithTeams[] };

interface LeagueDetailClientProps {
  league: LeagueWithDetails;
  users: User[];
}

const LeagueDetailClient: React.FC<LeagueDetailClientProps> = ({ league, users }) => {
  const router = useRouter();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingMatch, setEditingMatch] = useState<MatchWithTeams | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [matchDates, setMatchDates] = useState<{ [matchId: string]: string }>({});

  // Initialize match dates when component loads
  useEffect(() => {
    const initialDates: { [matchId: string]: string } = {};
    league.matches.forEach(match => {
      if (match.matchDate) {
        initialDates[match.id] = new Date(match.matchDate).toISOString().split('T')[0];
      }
    });
    setMatchDates(initialDates);
  }, [league.matches]);

  const handleDateChange = (matchId: string, date: string) => {
    setMatchDates(prev => ({ ...prev, [matchId]: date }));
  };

  const handleUpdateMatchDates = async () => {
    setIsLoading(true);
    const matchesToUpdate = Object.entries(matchDates).map(([id, matchDate]) => ({ id, matchDate }));
    try {
      const response = await fetch(`/api/leagues/${league.id}/matches`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchesToUpdate }),
      });
      if (!response.ok) throw new Error("No se pudieron guardar las fechas.");
      alert("Fechas guardadas con éxito.");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al guardar las fechas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTeamModal = (team: Team | null = null) => {
    setEditingTeam(team);
    setIsTeamModalOpen(true);
  };
  
  const handleOpenResultModal = (match: MatchWithTeams) => {
    setEditingMatch(match);
    setIsResultModalOpen(true);
  };

  const handleGenerateSchedule = async () => {
    if (!scheduleDate) {
      alert("Por favor, selecciona una fecha para generar el calendario.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leagues/${league.id}/generate-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: scheduleDate }),
      });
      if (!response.ok) throw new Error("No se pudo generar el calendario.");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al generar el calendario.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AddTeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} leagueId={league.id} users={users} teamToEdit={editingTeam} />
      {editingMatch && <AddResultModal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} match={editingMatch} />}
      
      {/* Teams List Column */}
      <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl shadow-lg self-start">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Equipos</h2>
          <button onClick={() => handleOpenTeamModal()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"><PlusCircle className="h-4 w-4" />Añadir</button>
        </div>
        {league.teams.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {league.teams.map(team => (
              <li key={team.id} className="py-3 flex justify-between items-center group">
                <div>
                  <p className="font-medium text-white">{team.name}</p>
                  <p className="text-sm text-gray-400">{team.player1.name} / {team.player2.name}</p>
                </div>
                <button onClick={() => handleOpenTeamModal(team)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity">
                  <Pencil className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="text-gray-500 text-center py-8">Aún no hay equipos.</p>}
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-white">Calendario</h2>
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button onClick={handleGenerateSchedule} disabled={isLoading || league.teams.length < 2 || !scheduleDate} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {isLoading ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </div>
          {league.matches.length > 0 ? (
            <div>
              <ul className="divide-y divide-gray-700">
                {league.matches.map(match => (
                  <li key={match.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
                    <p className="text-white flex-1">{match.team1.name} vs {match.team2.name}</p>
                    <div className="flex items-center gap-2">
                      <input type="date" value={matchDates[match.id] || ''} onChange={(e) => handleDateChange(match.id, e.target.value)} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm" />
                      <button onClick={() => handleOpenResultModal(match)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-lg">
                        <Edit className="h-4 w-4" />
                        <span>{match.result || 'Resultado'}</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end mt-4">
                <button onClick={handleUpdateMatchDates} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500">
                  <Save className="h-4 w-4" />
                  Guardar Fechas
                </button>
              </div>
            </div>
          ) : <p className="text-gray-500 text-center py-12">Genera el calendario para ver los partidos.</p>}
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Clasificación</h2>
          {league.teams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3">Equipo</th>
                    <th className="px-2 py-3 text-center" title="Partidos Jugados">PJ</th>
                    <th className="px-2 py-3 text-center" title="Partidos Ganados">PG</th>
                    <th className="px-2 py-3 text-center" title="Partidos Perdidos">PP</th>
                    <th className="px-2 py-3 text-center" title="Sets a Favor">SF</th>
                    <th className="px-2 py-3 text-center" title="Sets en Contra">SC</th>
                    <th className="px-2 py-3 text-center" title="Diferencia de Sets">DS</th>
                    <th className="px-2 py-3 text-center" title="Juegos a Favor">JF</th>
                    <th className="px-2 py-3 text-center" title="Juegos en Contra">JC</th>
                    <th className="px-2 py-3 text-center" title="Diferencia de Juegos">DJ</th>
                    <th className="px-2 py-3 text-center" title="Puntos">Ptos</th>
                  </tr>
                </thead>
                <tbody>
                  {league.teams.map(team => (
                    <tr key={team.id} className="border-b border-gray-700">
                      <td className="px-4 py-3 font-medium text-white">{team.name}</td>
                      <td className="px-2 py-3 text-center">{team.played}</td>
                      <td className="px-2 py-3 text-center text-green-400">{team.won}</td>
                      <td className="px-2 py-3 text-center text-red-400">{team.lost}</td>
                      <td className="px-2 py-3 text-center">{team.setsFor}</td>
                      <td className="px-2 py-3 text-center">{team.setsAgainst}</td>
                      <td className="px-2 py-3 text-center font-medium">{team.setsFor - team.setsAgainst}</td>
                      <td className="px-2 py-3 text-center">{team.gamesFor}</td>
                      <td className="px-2 py-3 text-center">{team.gamesAgainst}</td>
                      <td className="px-2 py-3 text-center font-medium">{team.gamesFor - team.gamesAgainst}</td>
                      <td className="px-2 py-3 text-center font-bold text-lg text-indigo-400">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-gray-500 text-center py-12">La clasificación aparecerá aquí.</p>}
        </div>
      </div>
    </>
  );
};

export default LeagueDetailClient;