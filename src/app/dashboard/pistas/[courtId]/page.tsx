import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import EditCourtForm from '@/components/pistas/EditCourtForm';
import Link from 'next/link';
import { ArrowLeft, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditCourtPageProps {
  params: {
    courtId: string;
  };
}

const EditCourtPage = async ({ params }: EditCourtPageProps) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.clubId) {
    redirect('/login');
  }

  const court = await db.court.findUnique({
    where: {
      id: params.courtId,
      clubId: session.user.clubId,
    },
  });

  if (!court) {
    return (
      <div>
        <h1 className="font-bold">Pista no encontrada</h1>
        <p className="text-muted-foreground">La pista que buscas no existe o no pertenece a tu club.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/pistas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Pista</h1>
          <p className="mt-1 text-muted-foreground">Modifica los detalles de &quot;{court.name}&quot;.</p>
        </div>
      </div>

      <div className="bg-card border p-6 sm:p-8 rounded-xl shadow-sm">
        <EditCourtForm court={court} />
      </div>

      <div className="mt-4">
        <Link
          href={`/dashboard/pistas/${params.courtId}/precios`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
        >
          <Euro className="h-4 w-4" />
          Configurar precios por franja horaria
        </Link>
      </div>
    </div>
  );
};

export default EditCourtPage;
