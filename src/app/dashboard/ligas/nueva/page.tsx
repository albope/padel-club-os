import React from 'react';
import AddLeagueForm from '@/components/ligas/AddLeagueForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const AddLeaguePage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ligas">
          <span className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Crear Nueva Liga</h1>
          <p className="mt-1 text-gray-400">Define el nombre de tu nueva competición.</p>
        </div>
      </div>

      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        <AddLeagueForm />
      </div>
    </div>
  );
};

export default AddLeaguePage;