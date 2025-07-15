import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Trophy, PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';

// This Server Component fetches the leagues data for the club
const LigasPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.clubId) {
    redirect('/dashboard'); // Or show a message to create a club
  }

  const leagues = await db.league.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { teams: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Ligas</h1>
          <p className="mt-1 text-gray-400">Crea y administra las competiciones de tu club.</p>
        </div>
        <Link href="/dashboard/ligas/nueva">
          <span className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 transition-colors duration-300 cursor-pointer">
            <PlusCircle className="h-5 w-5" />
            Crear Nueva Liga
          </span>
        </Link>
      </div>

      {/* Leagues List */}
      <div className="bg-gray-800 rounded-xl shadow-lg">
        <div className="p-6">
          {leagues.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {/* --- INICIO DE LA MODIFICACIÓN --- */}
              {leagues.map((league) => (
                <li key={league.id}>
                  <Link
                    href={`/dashboard/ligas/${league.id}`}
                    className="group flex items-center justify-between py-4 px-2 -mx-2 rounded-lg transition-colors hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-700 rounded-lg">
                        <Trophy className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{league.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {league._count.teams} Equipos</span>
                        </div>
                      </div>
                    </div>
                    {}
                  </Link>
                </li>
              ))}
              {}
            </ul>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Aún no has creado ninguna liga.</p>
              <p className="text-sm text-gray-500 mt-1">Haz clic en "Crear Nueva Liga" para empezar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LigasPage;