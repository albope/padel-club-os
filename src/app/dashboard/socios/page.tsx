import React from 'react';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { PlusCircle, Upload } from 'lucide-react';
import Link from 'next/link';
import SociosClient from '@/components/socios/SociosClient';
import { Button } from '@/components/ui/button';

const SociosPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/dashboard');
  }

  const usersWithStatsData = await db.user.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { bookings: true } },
      bookings: { where: { startTime: { gte: new Date() } }, select: { id: true } },
    },
  });

  const initialSocios = usersWithStatsData.map(user => ({
    ...user,
    isAdmin: user.id === session.user.id,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion de Socios</h1>
          <p className="mt-1 text-muted-foreground">Consulta y anade nuevos socios a tu club.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild>
            <Link href="/dashboard/socios/importar">
              <Upload className="h-5 w-5" />
              Importar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/socios/nuevo">
              <PlusCircle className="h-5 w-5" />
              Anadir Socio
            </Link>
          </Button>
        </div>
      </div>

      <SociosClient initialSocios={JSON.parse(JSON.stringify(initialSocios))} />
    </div>
  );
};

export default SociosPage;
