'use client';

import React, { useState } from 'react';
import { League, Team, User } from '@prisma/client';
import { PlusCircle } from 'lucide-react';
import AddTeamModal from './AddTeamModal';

// Define the shape of the props
type TeamWithPlayers = Team & {
  player1: { name: string | null };
  player2: { name: string | null };
};
type LeagueWithTeams = League & { teams: TeamWithPlayers[] };

interface LeagueDetailClientProps {
  league: LeagueWithTeams;
  users: User[];
}

const LeagueDetailClient: React.FC<LeagueDetailClientProps> = ({ league, users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <AddTeamModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leagueId={league.id}
        users={users}
      />
      <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Equipos Inscritos</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
          >
            <PlusCircle className="h-4 w-4" />
            Añadir
          </button>
        </div>
        {league.teams.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {league.teams.map(team => (
              <li key={team.id} className="py-3">
                <p className="font-medium text-white">{team.name}</p>
                <p className="text-sm text-gray-400">{team.player1.name} / {team.player2.name}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-8">Aún no hay equipos inscritos.</p>
        )}
      </div>
    </>
  );
};

export default LeagueDetailClient;