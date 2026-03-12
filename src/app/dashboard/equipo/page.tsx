import React from 'react';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EquipoClient from '@/components/equipo/EquipoClient';

export default async function EquipoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/dashboard');
  }

  const t = await getTranslations('team');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('titulo')}</h1>
        <p className="mt-1 text-muted-foreground">{t('descripcion')}</p>
      </div>
      <EquipoClient />
    </div>
  );
}
