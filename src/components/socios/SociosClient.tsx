'use client';

import React, { useState, useMemo } from 'react';
import { User } from '@prisma/client';
import { Pencil, ShieldCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import SocioDetailModal from './SocioDetailModal';

type SocioWithStats = User & {
  _count: {
    bookings: number;
  };
  bookings: { id: string }[];
  isAdmin: boolean;
};

interface SociosClientProps {
  initialSocios: SocioWithStats[];
}

const SociosClient: React.FC<SociosClientProps> = ({ initialSocios }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<SocioWithStats | null>(null);
  
  // --- AÑADIDO: Estados para búsqueda y paginación ---
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const sociosPerPage = 10;

  // --- AÑADIDO: Lógica para filtrar y paginar socios ---
  const filteredSocios = useMemo(() => {
    return initialSocios.filter(socio =>
      socio.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialSocios, searchTerm]);

  const currentSocios = useMemo(() => {
    const indexOfLastSocio = currentPage * sociosPerPage;
    const indexOfFirstSocio = indexOfLastSocio - sociosPerPage;
    return filteredSocios.slice(indexOfFirstSocio, indexOfLastSocio);
  }, [filteredSocios, currentPage, sociosPerPage]);
  
  const totalPages = Math.ceil(filteredSocios.length / sociosPerPage);

  const handleOpenModal = (socio: SocioWithStats) => {
    setSelectedSocio(socio);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSocio(null);
  };

  return (
    <>
      {/* --- AÑADIDO: Componente de Búsqueda --- */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Buscar socio por nombre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page to 1 on new search
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-lg">
        <div className="p-4">
          {currentSocios.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {/* --- MODIFICADO: Mapeamos sobre `currentSocios` --- */}
              {currentSocios.map((socio) => (
                <li
                  key={socio.id}
                  onClick={() => handleOpenModal(socio)}
                  className="group flex items-center justify-between py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-gray-700/50 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={socio.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(socio.name || 'S')}&background=random&color=fff`}
                      alt="Avatar"
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                        <div className="flex items-center gap-2">
                           <p className="font-semibold text-white">{socio.name}</p>
                           {socio.isAdmin && (
                            <span className="flex items-center gap-1 text-xs font-medium text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                                <ShieldCheck className="h-3 w-3" />
                                Admin
                            </span>
                           )}
                        </div>
                    </div>
                  </div>
                  {!socio.isAdmin && (
                    <Link href={`/dashboard/socios/${socio.id}`} onClick={(e) => e.stopPropagation()} className="p-2 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-white rounded-full hover:bg-gray-700 transition-all">
                      <Pencil className="h-4 w-4" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No se encontraron socios con ese nombre.</p>
            </div>
          )}
        </div>
        
        {/* --- AÑADIDO: Controles de Paginación --- */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-700 px-6 py-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="text-sm text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <SocioDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        socio={selectedSocio}
      />
    </>
  );
};

export default SociosClient;