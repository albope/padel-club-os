'use client';

import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core'; // Corrected import for the type
import { Booking, Court, User } from '@prisma/client';
import BookingModal from './BookingModal';

// --- (CalendarStyles component remains the same) ---
const CalendarStyles = () => <style>{`
      /* Toolbar Buttons */
      .fc-button-primary { background-color: #4f46e5 !important; border-color: #4f46e5 !important; }
      .fc-button-primary:hover { background-color: #4338ca !important; }
      .fc-button-primary:disabled { background-color: #4b5563 !important; }
      .fc-button-active { background-color: #3730a3 !important; border-color: #3730a3 !important; }
      .fc-toolbar-title { color: #ffffff; }
      .fc-theme-standard td, .fc-theme-standard th, .fc-scrollgrid, .fc-view { border-color: #374151; }
      .fc-col-header-cell-cushion { color: #d1d5db; text-decoration: none; }
      .fc-timegrid-axis-cushion, .fc-timegrid-slot-label { color: #9ca3af; }
      :root { --fc-event-text-color: #ffffff; }
      .fc-day-today { background-color: rgba(79, 70, 229, 0.1) !important; }
      .fc-event { border: 1px solid rgba(0,0,0,0.3); }
`}</style>;

// Define the shape of the props
export type BookingWithDetails = Booking & { user: { name: string | null }; court: { name: string } };
interface CalendarViewProps {
  initialBookings: BookingWithDetails[];
  courts: Court[];
  users: User[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ initialBookings, courts, users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // This state will hold either the date for a new booking, or the data of an existing one
  const [selectedInfo, setSelectedInfo] = useState<Date | BookingWithDetails | null>(null);

const events = useMemo(() => {
  // Es una buena práctica comprobar que initialBookings no sea nulo.
  if (!initialBookings) return [];

  return initialBookings.map((booking) => {
    // --- SOLUCIÓN ---: Mueve la definición de la constante aquí DENTRO.
    const displayName = booking.user?.name || booking.guestName || 'Invitado';

    return {
      id: booking.id,
      // Ahora 'displayName' sí existe en este contexto.
      title: `${booking.court.name} - ${displayName}`,
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      extendedProps: booking,
    };
  });
}, [initialBookings]);

  // Handler for creating a NEW booking
  const handleDateClick = (arg: DateClickArg) => {
    setSelectedInfo(arg.date);
    setIsModalOpen(true);
  };

  // Handler for editing an EXISTING booking
  const handleEventClick = (arg: EventClickArg) => {
    // Retrieve the full booking object from the event
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