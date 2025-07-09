import React from 'react';
import AddSocioForm from '@/components/socios/AddSocioForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const AddSocioPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/socios">
          <span className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Añadir Nuevo Socio</h1>
          <p className="mt-1 text-gray-400">Rellena los datos para registrar un nuevo socio en tu club.</p>
        </div>
      </div>
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        <AddSocioForm />
      </div>
    </div>
  );
};

export default AddSocioPage;