// Path: src/app/dashboard/competitions/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import CompetitionsClient from '@/components/competitions/CompetitionsClient';

const CompetitionsPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/dashboard');
  }

  // Obtenemos TODAS las competiciones, el cliente se encargará de filtrar
  const competitions = await db.competition.findMany({
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

      {/* Renderizamos el nuevo componente cliente */}
      <CompetitionsClient initialCompetitions={JSON.parse(JSON.stringify(competitions))} />
      
    </div>
  );
};

export default CompetitionsPage;