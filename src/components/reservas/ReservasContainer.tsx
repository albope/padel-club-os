'use client';

import React, { useState, useMemo } from 'react';
import { Court, User } from '@prisma/client';
import { Calendar, LayoutGrid, ChevronLeft, ChevronRight, Download, CreditCard } from 'lucide-react';
import CalendarView, { BookingWithDetails } from './CalendarView';
import CourtGridView from './CourtGridView';
import BookingModal from './BookingModal';
import PendingPayments from './PendingPayments';
import { Button } from '@/components/ui/button';

interface ReservasContainerProps {
  initialBookings: BookingWithDetails[];
  courts: Court[];
  users: User[];
}

const ReservasContainer: React.FC<ReservasContainerProps> = ({ initialBookings, courts, users }) => {
  const [view, setView] = useState<'calendar' | 'grid' | 'payments'>('grid');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<Date | BookingWithDetails | null>(null);

  const pendingCount = useMemo(() =>
    initialBookings.filter(b => b.paymentStatus === 'pending' && !b.cancelledAt).length,
    [initialBookings]
  );

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

  const formatDisplayDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    }
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
        <h1 className="text-3xl font-bold">Calendario de Reservas</h1>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => window.open("/api/bookings/export", "_blank")}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>

          {/* Controles de navegación de día (solo para vista de parrilla) */}
          {view === 'grid' && (
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <button onClick={handlePrevDay} className="p-1.5 rounded-md hover:bg-accent">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-semibold text-center w-32">{formatDisplayDate(currentDate)}</span>
                <button onClick={handleNextDay} className="p-1.5 rounded-md hover:bg-accent">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
          )}

          {/* View Switcher */}
          <div className="flex items-center bg-muted rounded-lg p-1 space-x-1">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
            >
              <Calendar className="h-5 w-5" />
            </button>
            <button
              onClick={() => setView('payments')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative ${view === 'payments' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
            >
              <CreditCard className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {view === 'payments' ? (
        <PendingPayments bookings={initialBookings} />
      ) : (
        <div className="bg-card border rounded-xl shadow-sm p-4 sm:p-6">
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
      )}

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
