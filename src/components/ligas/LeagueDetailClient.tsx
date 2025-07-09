'use client';

import React, { useState } from 'react';
import { League, Team, User, Match } from '@prisma/client';
import { PlusCircle, Zap, Loader2, Pencil } from 'lucide-react';
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

  const handleOpenModal = (team: Team | null = null) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
  };

  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leagues/${league.id}/generate-schedule`, {
        method: 'POST',
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Calendario</h2>
            <button onClick={handleGenerateSchedule} disabled={isLoading || league.teams.length < 2} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {isLoading ? 'Generando...' : 'Generar Calendario'}
            </button>
          </div>
          {league.matches.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {league.matches.map(match => (
                <li key={match.id} className="py-3 flex justify-between items-center">
                  <p className="text-white">{match.team1.name} vs {match.team2.name}</p>
                  <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">Pendiente</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-gray-500 text-center py-12">El calendario se generará una vez que se hayan inscrito todos los equipos.</p>}
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Clasificación</h2>
          {league.teams.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-2 text-gray-400 font-medium">Equipo</th>
                  <th className="py-2 text-gray-400 font-medium text-center">PJ</th>
                  <th className="py-2 text-gray-400 font-medium text-center">PG</th>
                  <th className="py-2 text-gray-400 font-medium text-center">PP</th>
                  <th className="py-2 text-gray-400 font-medium text-center">Ptos</th>
                </tr>
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