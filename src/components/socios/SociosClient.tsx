'use client';

import React, { useState } from 'react';
import { User } from '@prisma/client';
import { Pencil, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import SocioDetailModal from './SocioDetailModal'; // Importamos el modal que acabamos de crear

// Definimos el tipo de dato que espera el componente, incluyendo las estadísticas calculadas
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
      <div className="bg-gray-800 rounded-xl shadow-lg">
        <div className="p-4">
          {initialSocios.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {initialSocios.map((socio) => (
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
              <p className="text-gray-400">Aún no tienes socios en tu club.</p>
              <p className="text-sm text-gray-500 mt-1">Haz clic en "Añadir Socio" para empezar.</p>
            </div>
          )}
        </div>
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