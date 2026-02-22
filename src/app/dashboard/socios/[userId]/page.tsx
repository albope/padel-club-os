import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import EditSocioForm from '@/components/socios/EditSocioForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Socio no encontrado</h1>
        <p className="mt-2 text-muted-foreground">El socio que buscas no existe o no pertenece a tu club.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/socios">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Socio</h1>
          <p className="mt-1 text-muted-foreground">Modifica los detalles de &quot;{socio.name}&quot;.</p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <EditSocioForm socio={socio} />
      </Card>
    </div>
  );
};

export default EditSocioPage;
