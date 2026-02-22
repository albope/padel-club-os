import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AddPartidaForm from '@/components/partidas-abiertas/AddPartidaForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const AddPartidaAbiertaPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/login');
  }

  const courts = await db.court.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { name: 'asc' }
  });

  const users = await db.user.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/partidas-abiertas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Abrir Nueva Partida</h1>
          <p className="mt-1 text-muted-foreground">Configura una nueva partida para que los socios se apunten.</p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <AddPartidaForm courts={courts} users={users} />
      </Card>
    </div>
  );
};

export default AddPartidaAbiertaPage;
