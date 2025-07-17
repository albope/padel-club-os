import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AddPartidaForm from '@/components/partidas-abiertas/AddPartidaForm';

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
        <Link href="/dashboard/partidas-abiertas"><span className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"><ArrowLeft className="h-5 w-5" /></span></Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Editar Partida Abierta</h1>
          <p className="mt-1 text-gray-400">Modifica los detalles de la partida.</p>
        </div>
      </div>
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        <AddPartidaForm courts={courts} users={users} partidaToEdit={JSON.parse(JSON.stringify(partidaToEdit))} />
      </div>
    </div>
  );
};

export default EditPartidaPage;