'use client';

// --- AÑADIDO ---: Importamos los hooks y el icono necesario
import React, { useState, useEffect } from 'react';
import { Court, Booking } from '@prisma/client';
import { PlusCircle, Clock, ChevronDown } from 'lucide-react'; // Importamos ChevronDown
import { BookingWithDetails } from './CalendarView';

interface CourtGridViewProps {
  courts: Court[];
  bookings: BookingWithDetails[];
  selectedDate: Date;
  onSlotClick: (date: Date, courtId: string) => void;
  onBookingClick: (booking: BookingWithDetails) => void;
}

const generateTimeSlots = (startHour: number, endHour: number, interval: number): string[] => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
  }
  return slots;
};

const CourtGridView: React.FC<CourtGridViewProps> = ({ courts, bookings, selectedDate, onSlotClick, onBookingClick }) => {
  const timeSlots = generateTimeSlots(9, 23, 90);

  // --- AÑADIDO ---: Estado para gestionar las pistas expandidas/contraídas
  const [expandedCourts, setExpandedCourts] = useState<Record<string, boolean>>({});

  // --- AÑADIDO ---: useEffect para inicializar todas las pistas como expandidas por defecto
  useEffect(() => {
    const initialState: Record<string, boolean> = {};
    courts.forEach(court => {
      initialState[court.id] = true; // Todas las pistas empiezan expandidas
    });
    setExpandedCourts(initialState);
  }, [courts]);

  // --- AÑADIDO ---: Función para cambiar el estado de una pista
  const toggleCourtExpansion = (courtId: string) => {
    setExpandedCourts(prevState => ({
      ...prevState,
      [courtId]: !prevState[courtId],
    }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {courts.map(court => {
        const isExpanded = expandedCourts[court.id]; // Comprobamos si la pista actual está expandida

        const courtBookings = bookings.filter(b => {
          const bookingDate = new Date(b.startTime);
          return b.courtId === court.id &&
                 bookingDate.getDate() === selectedDate.getDate() &&
                 bookingDate.getMonth() === selectedDate.getMonth() &&
                 bookingDate.getFullYear() === selectedDate.getFullYear();
        });

        return (
          <div key={court.id} className="bg-gray-800 rounded-xl shadow-lg flex flex-col">
            {/* --- MODIFICADO ---: El título ahora es un botón clicable */}
            <button
              onClick={() => toggleCourtExpansion(court.id)}
              className="w-full flex items-center justify-between p-4 text-center font-bold text-white border-b border-gray-700 bg-gray-700/50 rounded-t-xl hover:bg-gray-700 transition-colors"
            >
              <span>{court.name}</span>
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
            
            {/* --- MODIFICADO ---: El contenido solo se muestra si la pista está expandida */}
            {isExpanded && (
              <div className="p-4 space-y-3">
                {timeSlots.map(slot => {
                  const [hour, minute] = slot.split(':').map(Number);
                  const slotDate = new Date(selectedDate);
                  slotDate.setHours(hour, minute, 0, 0);

                  const booking = courtBookings.find(b => new Date(b.startTime).getTime() === slotDate.getTime());

                  if (booking) {
                    const startTime = new Date(booking.startTime);
                    const endTime = new Date(booking.endTime);
                    const timeRange = `${startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
                    const displayName = booking.guestName || booking.user?.name || 'Reservado';
                    return (
                      <div key={slot} onClick={() => onBookingClick(booking)} className="bg-indigo-600 rounded-lg p-3 text-white cursor-pointer hover:bg-indigo-500 transition-colors">
                        <p className="font-semibold text-sm truncate">{displayName}</p>
                        <p className="text-xs text-indigo-200">{timeRange}</p>
                      </div>
                    );
                  } else {
                    return (
                      <div key={slot} onClick={() => onSlotClick(slotDate, court.id)} className="bg-gray-700/50 rounded-lg p-3 text-gray-400 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors">
                        <div className="flex items-center"><Clock className="h-4 w-4 mr-2" /><span className="text-sm">{slot}</span></div>
                        <PlusCircle className="h-5 w-5 text-gray-500" />
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourtGridView;