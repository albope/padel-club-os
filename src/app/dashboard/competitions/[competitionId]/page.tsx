import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CompetitionDetailClient from '@/components/competitions/CompetitionDetailClient';
import { Button } from '@/components/ui/button';

interface CompetitionDetailPageProps {
  params: {
    competitionId: string;
  };
}

const CompetitionDetailPage = async ({ params }: CompetitionDetailPageProps) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/dashboard');
  }

  const competition = await db.competition.findUnique({
    where: { id: params.competitionId, clubId: session.user.clubId },
    include: {
      teams: {
        include: {
          player1: { select: { name: true } },
          player2: { select: { name: true } },
        },
      },
      matches: {
        include: {
          team1: {
            include: {
              player1: { select: { name: true } },
              player2: { select: { name: true } },
            },
          },
          team2: {
            include: {
              player1: { select: { name: true } },
              player2: { select: { name: true } },
            },
          },
        },
        orderBy: { roundNumber: 'asc' },
      },
    },
  });

  const users = await db.user.findMany({
    where: {
      clubId: session.user.clubId,
      id: { not: session.user.id }
    },
    orderBy: { name: 'asc' }
  });

  if (!competition) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Competicion no encontrada</h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/competitions">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{competition.name}</h1>
          <p className="mt-1 text-muted-foreground">Gestiona los equipos, el cuadro y los resultados.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <CompetitionDetailClient
          competition={JSON.parse(JSON.stringify(competition))}
          users={JSON.parse(JSON.stringify(users))}
        />
      </div>
    </div>
  );
};

export default CompetitionDetailPage;
