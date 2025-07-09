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
        },
        orderBy: { points: 'desc' }, // Order teams for the standings
      },
      matches: { // Fetch the generated matches
        include: {
          team1: { select: { name: true } },
          team2: { select: { name: true } },
        },
        orderBy: { round: 'asc' },
      }
    }
  });

  const users = await db.user.findMany({ orderBy: { name: 'asc' } });

  if (!league) {
    return <div><h1 className="text-white">Liga no encontrada</h1></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ligas"><span className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"><ArrowLeft className="h-5 w-5" /></span></Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{league.name}</h1>
          <p className="mt-1 text-gray-400">Gestiona los equipos, el calendario y la clasificación.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pass all necessary data to the client component */}
        <LeagueDetailClient 
          league={JSON.parse(JSON.stringify(league))} 
          users={users}
        />
      </div>
    </div>
  );
};

export default LeagueDetailPage;