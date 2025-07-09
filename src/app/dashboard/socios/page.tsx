import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Users, PlusCircle, Mail, Phone, Pencil, ShieldCheck } from 'lucide-react';
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
              {users.map((user) => {
                const isAdmin = user.id === session.user.id;
                return (
                  <li key={user.id} className="group flex items-center justify-between py-3">
                    <div className="flex items-center gap-4">
                      <img 
                        src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'S')}&background=random&color=fff`}
                        alt="Avatar"
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{user.name}</p>
                          {isAdmin && (
                            <span className="flex items-center gap-1 text-xs font-medium text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-2"><Mail className="h-4 w-4" />{user.email}</span>
                          {user.phone && (
                            <span className="flex items-center gap-2 mt-1 sm:mt-0"><Phone className="h-4 w-4" />{user.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isAdmin ? (
                      <span className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 cursor-not-allowed" title="No puedes editar tu propia cuenta desde aquí">
                        <Pencil className="h-4 w-4" />
                        Editar
                      </span>
                    ) : (
                      <Link href={`/dashboard/socios/${user.id}`}>
                        <span className="flex items-center gap-2 px-3 py-1 text-sm text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded-md transition-opacity">
                          <Pencil className="h-4 w-4" />
                          Editar
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
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