import React from 'react';
import AddCourtForm from '@/components/pistas/AddCourtForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AddCourtPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/pistas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Añadir Nueva Pista</h1>
          <p className="mt-1 text-muted-foreground">Rellena los detalles de la nueva pista para tu club.</p>
        </div>
      </div>

      <div className="bg-card border p-6 sm:p-8 rounded-xl shadow-sm">
        <AddCourtForm />
      </div>
    </div>
  );
};

export default AddCourtPage;
