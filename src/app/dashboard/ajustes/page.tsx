import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import SettingsForm from '@/components/ajustes/SettingsForm';
import { Club } from '@prisma/client';

// This Server Component fetches the current club settings
const AjustesPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.clubId) {
    redirect('/login');
  }

  const club = await db.club.findUnique({
    where: {
      id: session.user.clubId,
    },
  });

  if (!club) {
    return <div>Club no encontrado.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Ajustes del Club</h1>
        <p className="mt-1 text-gray-400">Gestiona la información y el horario de tu club.</p>
      </div>

      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        <SettingsForm club={club} />
      </div>
    </div>
  );
};

export default AjustesPage;