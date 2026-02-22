import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ImportSociosClient from '@/components/socios/ImportSociosClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ImportSociosPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/socios">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Importar Socios</h1>
          <p className="mt-1 text-muted-foreground">Anade multiples socios a tu club subiendo un archivo CSV o TXT.</p>
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <ImportSociosClient />
      </Card>
    </div>
  );
};

export default ImportSociosPage;
