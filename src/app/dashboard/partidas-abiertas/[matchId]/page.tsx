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

const EditPartidaPage = async ({ params }: { params: { matchId: string }}) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) redirect('/login');

  const partidaToEdit = await db.openMatch.findUnique({
    where: { id: params.matchId, clubId: session.user.clubId },
    include: { players: { select: { userId: true }}}
  });

  if (!partidaToEdit) return <div>Partida no encontrada.</div>;

  const courts = await db.court.findMany({ where: { clubId: session.user.clubId }});
  const users = await db.user.findMany({ where: { clubId: session.user.clubId }});

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/partidas-abiertas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Partida Abierta</h1>
          <p className="mt-1 text-muted-foreground">Modifica los detalles de la partida.</p>
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <AddPartidaForm courts={courts} users={users} partidaToEdit={JSON.parse(JSON.stringify(partidaToEdit))} />
      </Card>
    </div>
  );
};

export default EditPartidaPage;
