import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ImportPistasClient from '@/components/pistas/ImportPistasClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ImportPistasPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/pistas" aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Importar Pistas</h1>
          <p className="mt-1 text-muted-foreground">Anade multiples pistas a tu club subiendo un archivo CSV o TXT.</p>
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <ImportPistasClient />
      </Card>
    </div>
  );
};

export default ImportPistasPage;
