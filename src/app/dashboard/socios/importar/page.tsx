// Path: src/app/dashboard/socios/importar/page.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ImportSociosClient from '@/components/socios/ImportSociosClient';

const ImportSociosPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/socios">
          <span className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Importar Socios</h1>
          <p className="mt-1 text-gray-400">Añade múltiples socios a tu club subiendo un archivo CSV o TXT.</p>
        </div>
      </div>
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        <ImportSociosClient />
      </div>
    </div>
  );
};

export default ImportSociosPage;