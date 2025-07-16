import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Trophy, PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { CompetitionFormat } from '@prisma/client'; // Importamos el enum

const CompetitionsPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/dashboard');
  }

  // --- MODIFICADO: La consulta ahora es a db.competition ---
  const competitions = await db.competition.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { teams: true },
      },
    },
  });

  // --- AÑADIDO: Helper para traducir el formato a texto legible ---
  const formatToText = (format: CompetitionFormat) => {
    switch (format) {
      case 'LEAGUE': return 'Liga';
      case 'KNOCKOUT': return 'Torneo Eliminatorio';
      case 'GROUP_AND_KNOCKOUT': return 'Torneo con Grupos';
      default: return 'Competición';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Competiciones</h1>
          <p className="mt-1 text-gray-400">Crea y administra las ligas y torneos de tu club.</p>
        </div>
        <Link href="/dashboard/competitions/nueva">
          <span className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500">
            <PlusCircle className="h-5 w-5" />
            Crear Competición
          </span>
        </Link>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-lg">
        <div className="p-6">
          {competitions.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {competitions.map((competition) => (
                <li key={competition.id}>
                  {/* El enlace ahora apunta a la ruta de competiciones */}
                  <Link href={`/dashboard/competitions/${competition.id}`} className="group flex items-center justify-between py-4 px-2 -mx-2 rounded-lg transition-colors hover:bg-gray-700/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-700 rounded-lg"><Trophy className="h-6 w-6 text-yellow-400" /></div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-indigo-400">{competition.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          {/* --- AÑADIDO: Mostramos el formato de la competición --- */}
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300">
                            {formatToText(competition.format)}
                          </span>
                          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {competition._count.teams} Equipos</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Aún no has creado ninguna competición.</p>
              <p className="text-sm text-gray-500 mt-1">Haz clic en "Crear Competición" para empezar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionsPage;