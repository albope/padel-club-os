'use client';

import React from 'react';
import { User } from '@prisma/client';
import { X, Mail, Phone, Gamepad2, BarChart3, Cake, CalendarClock, CalendarCheck2, ShieldCheck } from 'lucide-react';

// Definimos el tipo de dato que espera el componente, incluyendo las estadísticas calculadas
type SocioWithStats = User & {
  _count: {
    bookings: number;
  };
  bookings: { id: string }[]; // Solo necesitamos el array para el conteo de activas
};

interface SocioDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  socio: SocioWithStats | null;
}

const SocioDetailModal: React.FC<SocioDetailModalProps> = ({ isOpen, onClose, socio }) => {
  if (!isOpen || !socio) return null;

  // Calculamos las estadísticas dentro del modal
  const reservasActivas = socio.bookings.length;
  const reservasTotales = socio._count.bookings;
  const edad = socio.birthDate ? Math.floor((new Date().getTime() - new Date(socio.birthDate).getTime()) / 3.15576e+10) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative border border-gray-700">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
          <X className="h-6 w-6" />
        </button>
        
        {/* --- Cabecera del Modal --- */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-700">
            <img 
                src={socio.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(socio.name || 'S')}&background=random&color=fff`}
                alt="Avatar"
                className="h-16 w-16 rounded-full"
            />
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">{socio.name}</h2>
                    {/* Aquí podríamos añadir la insignia de admin si fuera necesario */}
                </div>
                <p className="text-sm text-gray-400">{socio.email}</p>
            </div>
        </div>

        {/* --- Cuerpo del Modal con Detalles --- */}
        <div className="space-y-3 text-sm">
            {socio.phone && <p className="flex items-center gap-3 text-gray-300"><Phone className="h-5 w-5 text-gray-500"/> {socio.phone}</p>}
            {socio.position && <p className="flex items-center gap-3 text-gray-300"><Gamepad2 className="h-5 w-5 text-gray-500"/> {socio.position}</p>}
            {socio.level && <p className="flex items-center gap-3 text-gray-300"><BarChart3 className="h-5 w-5 text-gray-500"/> Nivel: {socio.level}</p>}
            {edad !== null && <p className="flex items-center gap-3 text-gray-300"><Cake className="h-5 w-5 text-gray-500"/> {edad} años</p>}
        </div>

        {/* --- Estadísticas de Reservas --- */}
        <div className="mt-4 border-t border-gray-700 pt-4 flex justify-around text-center">
            <div>
                <p className="flex items-center justify-center gap-2 font-bold text-2xl text-green-400"><CalendarCheck2 className="h-6 w-6" /> {reservasActivas}</p>
                <p className="text-xs text-gray-400 mt-1">Reservas Activas</p>
            </div>
            <div>
                <p className="flex items-center justify-center gap-2 font-bold text-2xl text-indigo-400"><CalendarClock className="h-6 w-6" /> {reservasTotales}</p>
                <p className="text-xs text-gray-400 mt-1">Reservas Totales</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SocioDetailModal;