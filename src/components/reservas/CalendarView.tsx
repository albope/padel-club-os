'use client';

import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import { Booking, Court, User } from '@prisma/client';
import BookingModal from './BookingModal';

const CalendarStyles = () => <style>{`
      .fc-button-primary { background-color: hsl(var(--primary)) !important; border-color: hsl(var(--primary)) !important; color: hsl(var(--primary-foreground)) !important; }
      .fc-button-primary:hover { opacity: 0.9; }
      .fc-button-primary:disabled { opacity: 0.5; }
      .fc-button-active { filter: brightness(0.85); }
      .fc-toolbar-title { color: hsl(var(--foreground)); }
      .fc-theme-standard td, .fc-theme-standard th, .fc-scrollgrid, .fc-view { border-color: hsl(var(--border)); }
      .fc-col-header-cell-cushion { color: hsl(var(--muted-foreground)); text-decoration: none; }
      .fc-timegrid-axis-cushion, .fc-timegrid-slot-label { color: hsl(var(--muted-foreground)); }
      :root { --fc-event-text-color: #ffffff; }
      .fc-day-today { background-color: hsl(var(--primary) / 0.05) !important; }
      .fc-event { border: 1px solid rgba(0,0,0,0.2); }
      .fc-daygrid-day-number { color: hsl(var(--foreground)); }
      .fc-more-link { color: hsl(var(--primary)); }
`}</style>;

// --- MODIFICADO: El tipo ahora incluye la relación con OpenMatch, corrigiendo el error ---
export type BookingWithDetails = Booking & {
    user: { name: string | null } | null;
    court: { name: string };
    openMatch: { levelMin: number | null, levelMax: number | null } | null;
};

interface CalendarViewProps {
  initialBookings: BookingWithDetails[];
  courts: Court[];
  users: User[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ initialBookings, courts, users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<Date | BookingWithDetails | null>(null);

  const events = useMemo(() => {
    if (!initialBookings) return [];

    return initialBookings.map((booking) => {
      // Si la reserva es de una partida abierta, la mostramos diferente
      if (booking.status === 'provisional') {
        let levelText = '';
        if (booking.openMatch?.levelMin && booking.openMatch?.levelMax) {
            levelText = ` (Nivel: ${booking.openMatch.levelMin}-${booking.openMatch.levelMax})`;
        } else if (booking.openMatch?.levelMin) {
            levelText = ` (Nivel: ${booking.openMatch.levelMin}+)`;
        } else if (booking.openMatch?.levelMax) {
            levelText = ` (Nivel: hasta ${booking.openMatch.levelMax})`;
        }

        return {
          id: booking.id,
          title: `${booking.court.name} - Partida Abierta${levelText}`,
          start: new Date(booking.startTime),
          end: new Date(booking.endTime),
          backgroundColor: '#16a34a',
          borderColor: '#15803d',
          extendedProps: booking,
        };
      }

      // Lógica para reservas confirmadas normales
      const displayName = booking.user?.name || booking.guestName || 'Invitado';
      return {
        id: booking.id,
        title: `${booking.court.name} - ${displayName}`,
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
        backgroundColor: '#4f46e5',
        borderColor: '#4338ca',
        extendedProps: booking,
      };
    });
  }, [initialBookings]);

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedInfo(arg.date);
    setIsModalOpen(true);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const bookingData = arg.event.extendedProps as BookingWithDetails;
    setSelectedInfo(bookingData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInfo(null);
  };

  return (
    <div>
      <CalendarStyles />
      <BookingModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedInfo={selectedInfo}
        courts={courts}
        users={users}
      />
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        editable={true}
        selectable={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="23:00:00"
        height="75vh"
        locale="es"
        buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
      />
    </div>
  );
};

export default CalendarView;
