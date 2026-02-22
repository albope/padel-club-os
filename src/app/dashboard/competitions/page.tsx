import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import CompetitionsClient from '@/components/competitions/CompetitionsClient';
import { Button } from '@/components/ui/button';

const CompetitionsPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/dashboard');
  }

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
          <h1 className="text-3xl font-bold">Gestion de Competiciones</h1>
          <p className="mt-1 text-muted-foreground">Crea y administra las ligas y torneos de tu club.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/competitions/nueva">
            <PlusCircle className="h-5 w-5" />
            Crear Competicion
          </Link>
        </Button>
      </div>

      <CompetitionsClient initialCompetitions={JSON.parse(JSON.stringify(competitions))} />
    </div>
  );
};

export default CompetitionsPage;
