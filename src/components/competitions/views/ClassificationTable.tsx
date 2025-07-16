import React from 'react';
import { type TeamWithPlayers } from '@/types/competition.types';

interface ClassificationTableProps {
  teams: TeamWithPlayers[];
}

const ClassificationTable: React.FC<ClassificationTableProps> = ({ teams }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
        <tr>
          <th className="px-3 py-3">#</th>
          <th className="px-4 py-3">Pareja</th>
          <th className="px-2 py-3 text-center" title="Partidos Jugados">PJ</th>
          <th className="px-2 py-3 text-center" title="Puntos">PT</th>
          <th className="px-2 py-3 text-center" title="Partidos Ganados">PG</th>
          <th className="px-2 py-3 text-center" title="Partidos Perdidos">PP</th>
          <th className="px-2 py-3 text-center" title="Sets a Favor">SF</th>
          <th className="px-2 py-3 text-center" title="Sets en Contra">SC</th>
          <th className="px-2 py-3 text-center" title="Diferencia de Sets">DS</th>
          <th className="px-2 py-3 text-center" title="Juegos a Favor">JF</th>
          <th className="px-2 py-3 text-center" title="Juegos en Contra">JG</th>
          <th className="px-2 py-3 text-center" title="Diferencia de Juegos">DG</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((team, index) => {
          const setDiff = team.setsFor - team.setsAgainst;
          const gameDiff = team.gamesFor - team.gamesAgainst;
          return (
            <tr key={team.id} className="border-b border-gray-700 hover:bg-gray-700/50">
              <td className="px-3 py-3 text-center font-medium">{index + 1}</td>
              <td className="px-4 py-3 font-medium text-white">{team.name}</td>
              <td className="px-2 py-3 text-center">{team.played}</td>
              <td className="px-2 py-3 text-center font-bold text-lg text-indigo-400">{team.points}</td>
              <td className="px-2 py-3 text-center text-green-400">{team.won}</td>
              <td className="px-2 py-3 text-center text-red-400">{team.lost}</td>
              <td className="px-2 py-3 text-center">{team.setsFor}</td>
              <td className="px-2 py-3 text-center">{team.setsAgainst}</td>
              <td className={`px-2 py-3 text-center font-semibold ${setDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>{setDiff > 0 ? `+${setDiff}`: setDiff}</td>
              <td className="px-2 py-3 text-center">{team.gamesFor}</td>
              <td className="px-2 py-3 text-center">{team.gamesAgainst}</td>
              <td className={`px-2 py-3 text-center font-semibold ${gameDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>{gameDiff > 0 ? `+${gameDiff}`: gameDiff}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default ClassificationTable;