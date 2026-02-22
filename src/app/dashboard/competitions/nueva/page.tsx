import React from 'react';
import AddCompetitionForm from '@/components/competitions/AddCompetitionForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const AddCompetitionPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/competitions">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Crear Nueva Competicion</h1>
          <p className="mt-1 text-muted-foreground">Define el nombre y el formato de tu nueva competicion.</p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <AddCompetitionForm />
      </Card>
    </div>
  );
};

export default AddCompetitionPage;
