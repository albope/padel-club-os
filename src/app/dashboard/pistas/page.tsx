import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Fence, PlusCircle, Pencil, Upload } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/onboarding/EmptyState';

const PistasPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.clubId) {
    redirect('/dashboard');
  }

  const courts = await db.court.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion de Pistas</h1>
          <p className="mt-1 text-muted-foreground">Añade, edita y gestiona las pistas de tu club.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/pistas/importar">
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/pistas/nueva">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Pista
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm">
        <div className="p-6">
          {courts.length > 0 ? (
            <ul className="divide-y divide-border">
              {courts.map((court) => (
                <li key={court.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <Fence className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{court.name}</p>
                      <p className="text-sm text-muted-foreground">{court.type}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/pistas/${court.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Fence}
              title="Sin pistas configuradas"
              description="Añade las pistas de tu club para empezar a gestionar reservas."
              actionLabel="Añadir primera pista"
              actionHref="/dashboard/pistas/nueva"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PistasPage;
