import React from 'react';
import { type TeamWithPlayers } from '@/types/competition.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ClassificationTableProps {
  teams: TeamWithPlayers[];
}

const ClassificationTable: React.FC<ClassificationTableProps> = ({ teams }) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Pareja</TableHead>
          <TableHead className="text-center" title="Partidos Jugados">PJ</TableHead>
          <TableHead className="text-center" title="Puntos">PT</TableHead>
          <TableHead className="text-center" title="Partidos Ganados">PG</TableHead>
          <TableHead className="text-center" title="Partidos Perdidos">PP</TableHead>
          <TableHead className="text-center" title="Sets a Favor">SF</TableHead>
          <TableHead className="text-center" title="Sets en Contra">SC</TableHead>
          <TableHead className="text-center" title="Diferencia de Sets">DS</TableHead>
          <TableHead className="text-center" title="Juegos a Favor">JF</TableHead>
          <TableHead className="text-center" title="Juegos en Contra">JG</TableHead>
          <TableHead className="text-center" title="Diferencia de Juegos">DG</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.map((team, index) => {
          const setDiff = team.setsFor - team.setsAgainst;
          const gameDiff = team.gamesFor - team.gamesAgainst;
          return (
            <TableRow key={team.id}>
              <TableCell className="text-center font-medium">{index + 1}</TableCell>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell className="text-center">{team.played}</TableCell>
              <TableCell className="text-center font-bold text-lg text-primary">{team.points}</TableCell>
              <TableCell className="text-center text-green-600 dark:text-green-400">{team.won}</TableCell>
              <TableCell className="text-center text-red-600 dark:text-red-400">{team.lost}</TableCell>
              <TableCell className="text-center">{team.setsFor}</TableCell>
              <TableCell className="text-center">{team.setsAgainst}</TableCell>
              <TableCell className={`text-center font-semibold ${setDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{setDiff > 0 ? `+${setDiff}`: setDiff}</TableCell>
              <TableCell className="text-center">{team.gamesFor}</TableCell>
              <TableCell className="text-center">{team.gamesAgainst}</TableCell>
              <TableCell className={`text-center font-semibold ${gameDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{gameDiff > 0 ? `+${gameDiff}`: gameDiff}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

export default ClassificationTable;
