'use client';

import React, { useState, useEffect } from 'react';
import { Court } from '@prisma/client';
import { PlusCircle, Clock, ChevronDown, Users, BarChart3, Maximize, Minimize } from 'lucide-react';
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
  const [expandedCourts, setExpandedCourts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialState: Record<string, boolean> = {};
    courts.forEach(court => {
      initialState[court.id] = true;
    });
    setExpandedCourts(initialState);
  }, [courts]);

  const toggleCourtExpansion = (courtId: string) => {
    setExpandedCourts(prevState => ({
      ...prevState,
      [courtId]: !prevState[courtId],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded = courts.reduce((acc, court) => {
      acc[court.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedCourts(allExpanded);
  };

  const handleCollapseAll = () => {
    const allCollapsed = courts.reduce((acc, court) => {
      acc[court.id] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedCourts(allCollapsed);
  };

  return (
    <div>
        <div className="flex justify-end gap-2 mb-4">
            <button onClick={handleCollapseAll} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded-md hover:bg-accent">
                <Minimize className="h-4 w-4" />
                Contraer Todas
            </button>
            <button onClick={handleExpandAll} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded-md hover:bg-accent">
                <Maximize className="h-4 w-4" />
                Expandir Todas
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {courts.map(court => {
            const isExpanded = expandedCourts[court.id];
            const courtBookings = bookings.filter(b => {
            const bookingDate = new Date(b.startTime);
            return b.courtId === court.id &&
                    bookingDate.getDate() === selectedDate.getDate() &&
                    bookingDate.getMonth() === selectedDate.getMonth() &&
                    bookingDate.getFullYear() === selectedDate.getFullYear();
            });

            return (
            <div key={court.id} className="bg-card border rounded-xl shadow-sm flex flex-col">
                <button
                onClick={() => toggleCourtExpansion(court.id)}
                className="w-full flex items-center justify-between p-4 text-center font-bold border-b bg-muted/50 rounded-t-xl hover:bg-muted transition-colors"
                >
                <span>{court.name}</span>
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

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

                        if (booking.status === 'provisional') {
                            let levelText = null;
                            if (booking.openMatch?.levelMin && booking.openMatch?.levelMax) {
                                levelText = `${booking.openMatch.levelMin} - ${booking.openMatch.levelMax}`;
                            } else if (booking.openMatch?.levelMin) {
                                levelText = `Desde ${booking.openMatch.levelMin}`;
                            } else if (booking.openMatch?.levelMax) {
                                levelText = `Hasta ${booking.openMatch.levelMax}`;
                            }

                            return (
                                <div key={slot} onClick={() => onBookingClick(booking)} className="bg-green-600 rounded-lg p-3 text-white cursor-pointer hover:bg-green-500 transition-colors space-y-1">
                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                        <Users className="h-4 w-4" /> Partida Abierta
                                    </div>
                                    <p className="text-xs text-green-200">{timeRange}</p>
                                    {levelText && (
                                        <p className="flex items-center gap-1 text-xs text-green-200"><BarChart3 className="h-3 w-3" /> Nivel: {levelText}</p>
                                    )}
                                </div>
                            );
                        }

                        const displayName = booking.guestName || booking.user?.name || 'Reservado';
                        return (
                        <div key={slot} onClick={() => onBookingClick(booking)} className="bg-primary rounded-lg p-3 text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors">
                            <p className="font-semibold text-sm truncate">{displayName}</p>
                            <p className="text-xs opacity-75">{timeRange}</p>
                        </div>
                        );
                    } else {
                        return (
                        <div key={slot} onClick={() => onSlotClick(slotDate, court.id)} className="bg-muted/50 rounded-lg p-3 text-muted-foreground flex items-center justify-between cursor-pointer hover:bg-muted transition-colors">
                            <div className="flex items-center"><Clock className="h-4 w-4 mr-2" /><span className="text-sm">{slot}</span></div>
                            <PlusCircle className="h-5 w-5 opacity-50" />
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
    </div>
  );
};

export default CourtGridView;
