import React from 'react';
import AddSocioForm from '@/components/socios/AddSocioForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const AddSocioPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/socios">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Anadir Nuevo Socio</h1>
          <p className="mt-1 text-muted-foreground">Rellena los datos para registrar un nuevo socio en tu club.</p>
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <AddSocioForm />
      </Card>
    </div>
  );
};

export default AddSocioPage;
