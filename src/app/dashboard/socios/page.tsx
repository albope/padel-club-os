import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Users, PlusCircle, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

const SociosPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/dashboard');
  }

  const users = await db.user.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { name: 'asc' },
  });

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

      <div className="bg-gray-800 rounded-xl shadow-lg">
        <div className="p-6">
          {users.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {users.map((user) => (
                <li key={user.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'S')}&background=random&color=fff`}
                      alt="Avatar"
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-2"><Mail className="h-4 w-4" />{user.email}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Aún no tienes socios en tu club.</p>
              <p className="text-sm text-gray-500 mt-1">Haz clic en "Añadir Socio" para empezar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SociosPage;