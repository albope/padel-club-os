import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import EditSocioForm from '@/components/socios/EditSocioForm';

interface EditSocioPageProps {
  params: {
    userId: string;
  };
}

const EditSocioPage = async ({ params }: EditSocioPageProps) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.clubId) {
    redirect('/login');
  }

  const socio = await db.user.findUnique({
    where: {
      id: params.userId,
      clubId: session.user.clubId,
    },
  });

  if (!socio) {
    return (
      <div>
        <h1 className="text-white">Socio no encontrado</h1>
        <p className="text-gray-400">El socio que buscas no existe o no pertenece a tu club.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/socios">
          <span className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"><ArrowLeft className="h-5 w-5" /></span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Editar Socio</h1>
          <p className="mt-1 text-gray-400">Modifica los detalles de "{socio.name}".</p>
        </div>
      </div>

      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        <EditSocioForm socio={socio} />
      </div>
    </div>
  );
};

export default EditSocioPage;