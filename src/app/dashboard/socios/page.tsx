import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Users, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import SociosClient from '@/components/socios/SociosClient'; // Importamos el nuevo componente cliente

const SociosPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/dashboard');
  }

  // La consulta a la base de datos se mantiene igual
  const usersWithStatsData = await db.user.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { bookings: true } },
      bookings: { where: { startTime: { gte: new Date() } }, select: { id: true } }, // Solo seleccionamos el ID para eficiencia
    },
  });
  
  // Añadimos la propiedad 'isAdmin' a cada objeto para pasarla al cliente
  const initialSocios = usersWithStatsData.map(user => ({
    ...user,
    isAdmin: user.id === session.user.id,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Socios</h1>
          <p className="mt-1 text-gray-400">Consulta y añade nuevos socios a tu club.</p>
        </div>
        <Link href="/dashboard/socios/nuevo">
          <span className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500">
            <PlusCircle className="h-5 w-5" />
            Añadir Socio
          </span>
        </Link>
      </div>

      {/* Renderizamos el componente cliente y le pasamos los datos */}
      <SociosClient initialSocios={JSON.parse(JSON.stringify(initialSocios))} />
      
    </div>
  );
};

export default SociosPage;