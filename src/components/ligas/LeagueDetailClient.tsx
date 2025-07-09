'use client';

import React, { useState, useEffect } from 'react';
import { League, Team, User, Match } from '@prisma/client';
import { PlusCircle, Zap, Loader2, Pencil, Save } from 'lucide-react';
import AddTeamModal from './AddTeamModal';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
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

  const handleOpenModal = (team: Team | null = null) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
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
      <AddTeamModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        leagueId={league.id}
        users={users}
        teamToEdit={editingTeam}
      />
      
      {/* Left Column: Teams List */}
      <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl shadow-lg self-start">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Equipos</h2>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"><PlusCircle className="h-4 w-4" />Añadir</button>
        </div>
        {league.teams.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {league.teams.map(team => (
              <li key={team.id} className="py-3 flex justify-between items-center group">
                <div>
                  <p className="font-medium text-white">{team.name}</p>
                  <p className="text-sm text-gray-400">{team.player1.name} / {team.player2.name}</p>
                </div>
                <button onClick={() => handleOpenModal(team)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity">
                  <Pencil className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="text-gray-500 text-center py-8">Aún no hay equipos.</p>}
      </div>

      {/* Right Column: Calendar and Standings */}
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
                  <li key={match.id} className="py-3 flex justify-between items-center">
                    <p className="text-white">{match.team1.name} vs {match.team2.name}</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date"
                        value={matchDates[match.id] || ''}
                        onChange={(e) => handleDateChange(match.id, e.target.value)}
                        className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">Pendiente</span>
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
          ) : <p className="text-gray-500 text-center py-12">Selecciona una fecha y genera el calendario.</p>}
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Clasificación</h2>
          {league.teams.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700"><th className="py-2 text-gray-400 font-medium">Equipo</th><th className="py-2 text-gray-400 font-medium text-center">PJ</th><th className="py-2 text-gray-400 font-medium text-center">PG</th><th className="py-2 text-gray-400 font-medium text-center">PP</th><th className="py-2 text-gray-400 font-medium text-center">Ptos</th></tr>
              </thead>
              <tbody>
                {league.teams.map(team => (
                  <tr key={team.id} className="border-b border-gray-700 last:border-b-0">
                    <td className="py-3 text-white font-semibold">{team.name}</td>
                    <td className="py-3 text-center text-gray-300">{team.played}</td>
                    <td className="py-3 text-center text-gray-300">{team.won}</td>
                    <td className="py-3 text-center text-gray-300">{team.lost}</td>
                    <td className="py-3 text-center text-white font-bold">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-gray-500 text-center py-12">La clasificación aparecerá aquí.</p>}
        </div>
      </div>
    </>
  );
};

export default LeagueDetailClient;