'use client';

import React, { useState } from 'react';
import { Court, User } from '@prisma/client';
import { Calendar, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarView, { BookingWithDetails } from './CalendarView';
import CourtGridView from './CourtGridView';
import BookingModal from './BookingModal';

interface ReservasContainerProps {
  initialBookings: BookingWithDetails[];
  courts: Court[];
  users: User[];
}

const ReservasContainer: React.FC<ReservasContainerProps> = ({ initialBookings, courts, users }) => {
  const [view, setView] = useState<'calendar' | 'grid'>('grid');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<Date | BookingWithDetails | null>(null);

  // --- AÑADIDO: Funciones para navegar entre días ---
  const handlePrevDay = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  // --- AÑADIDO: Función para formatear la fecha a mostrar ---
  const formatDisplayDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // Comparamos solo la parte de la fecha, ignorando la hora
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    }
    // Formato amigable para otras fechas
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).format(date);
  };


  const handleSlotClick = (date: Date, courtId: string) => {
    setSelectedInfo(date);
    setIsModalOpen(true);
  };

  const handleBookingClick = (booking: BookingWithDetails) => {
    setSelectedInfo(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInfo(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Calendario de Reservas</h1>
        
        {/* --- MODIFICADO: Contenedor para todos los controles --- */}
        <div className="flex items-center gap-4">
          
          {/* Controles de navegación de día (solo para vista de parrilla) */}
          {view === 'grid' && (
            <div className="flex items-center gap-2 text-white bg-gray-800 rounded-lg p-1">
                <button onClick={handlePrevDay} className="p-1.5 rounded-md hover:bg-gray-700">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-semibold text-center w-32">{formatDisplayDate(currentDate)}</span>
                <button onClick={handleNextDay} className="p-1.5 rounded-md hover:bg-gray-700">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
          )}

          {/* View Switcher */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1 space-x-1">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'calendar' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              <Calendar className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
        {view === 'calendar' ? (
          <CalendarView 
            initialBookings={initialBookings}
            courts={courts}
            users={users}
          />
        ) : (
          <CourtGridView 
            courts={courts}
            bookings={initialBookings}
            selectedDate={currentDate}
            onSlotClick={handleSlotClick}
            onBookingClick={handleBookingClick}
          />
        )}
      </div>

      <BookingModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedInfo={selectedInfo}
        courts={courts}
        users={users}
      />
    </div>
  );
};

export default ReservasContainer;