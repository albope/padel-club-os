// Path: src/app/dashboard/partidas-abiertas/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import PartidasAbiertasClient from '@/components/partidas-abiertas/PartidasAbiertasClient';

const PartidasAbiertasPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/login');
  }

  // --- MODIFICADO: Obtenemos el nombre del club además de las partidas ---
  const club = await db.club.findUnique({
    where: { id: session.user.clubId },
    select: { name: true }
  });

  const openMatches = await db.openMatch.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { matchTime: 'asc' },
    include: {
      court: { select: { name: true } },
      players: { 
        select: { 
          user: { select: { id: true, name: true } } 
        },
        orderBy: { createdAt: 'asc' }
      },
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Partidas Abiertas</h1>
          <p className="mt-1 text-gray-400">Gestiona las partidas abiertas de tu club.</p>
        </div>
        <Link href="/dashboard/partidas-abiertas/nueva">
          <span className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500">
            <PlusCircle className="h-5 w-5" />
            Abrir Partida
          </span>
        </Link>
      </div>

      {/* --- MODIFICADO: Pasamos el nombre del club al componente cliente --- */}
      <PartidasAbiertasClient 
        initialMatches={JSON.parse(JSON.stringify(openMatches))}
        clubName={club?.name || 'Nuestro Club'}
      />
    </div>
  );
};

export default PartidasAbiertasPage;