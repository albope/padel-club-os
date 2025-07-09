import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Fence, PlusCircle, Pencil } from 'lucide-react';
import Link from 'next/link';

const PistasPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.clubId) {
    redirect('/dashboard'); // Or show a message to create a club
  }

  const courts = await db.court.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Pistas</h1>
          <p className="mt-1 text-gray-400">Añade, edita y gestiona las pistas de tu club.</p>
        </div>
        <Link href="/dashboard/pistas/nueva">
          <span className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500">
            <PlusCircle className="h-5 w-5" />
            Añadir Pista
          </span>
        </Link>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-lg">
        <div className="p-6">
          {courts.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {courts.map((court) => (
                <li key={court.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <Fence className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{court.name}</p>
                      <p className="text-sm text-gray-400">{court.type}</p>
                    </div>
                  </div>
                  <Link href={`/dashboard/pistas/${court.id}`}>
                    <span className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded-md">
                      <Pencil className="h-4 w-4" />
                      Editar
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Aún no has añadido ninguna pista.</p>
              <p className="text-sm text-gray-500 mt-1">Haz clic en "Añadir Pista" para empezar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PistasPage;