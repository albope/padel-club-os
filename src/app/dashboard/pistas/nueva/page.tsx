import React from 'react';
import AddCourtForm from '@/components/pistas/AddCourtForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const AddCourtPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pistas">
          <span className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Añadir Nueva Pista</h1>
          <p className="mt-1 text-gray-400">Rellena los detalles de la nueva pista para tu club.</p>
        </div>
      </div>

      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        <AddCourtForm />
      </div>
    </div>
  );
};

export default AddCourtPage;