import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LeagueDetailClient from '@/components/ligas/LeagueDetailClient';

interface LeagueDetailPageProps {
  params: {
    leagueId: string;
  };
}

const LeagueDetailPage = async ({ params }: LeagueDetailPageProps) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.clubId) {
    redirect('/dashboard');
  }

  const league = await db.league.findUnique({
    where: { id: params.leagueId, clubId: session.user.clubId },
    include: {
      teams: {
        include: {
          player1: { select: { name: true } },
          player2: { select: { name: true } },
        }
      }
    }
  });

  // Fetch all users to populate the "add team" modal dropdowns
  const users = await db.user.findMany({ orderBy: { name: 'asc' } });

  if (!league) {
    return (
      <div>
        <h1 className="text-white">Liga no encontrada</h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ligas">
          <span className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"><ArrowLeft className="h-5 w-5" /></span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{league.name}</h1>
          <p className="mt-1 text-gray-400">Gestiona los equipos, el calendario y la clasificación.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <LeagueDetailClient league={JSON.parse(JSON.stringify(league))} users={users} />
        
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Calendario de Partidos</h2>
            <p className="text-gray-500 text-center py-12">El calendario se generará una vez que se hayan inscrito todos los equipos.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Clasificación</h2>
            <p className="text-gray-500 text-center py-12">La clasificación aparecerá aquí cuando empiecen los partidos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueDetailPage;