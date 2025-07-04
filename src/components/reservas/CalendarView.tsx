'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// --- FullCalendar Styles ---
// It's a best practice to import the component's styles directly within it.
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';

// --- Custom Styles Component for Dark Theme ---
// This component injects CSS to override FullCalendar's default styles.
const CalendarStyles = () => {
  return (
    <style>{`
      /* Toolbar Buttons */
      .fc-button-primary {
        background-color: #4f46e5 !important; /* Indigo */
        border-color: #4f46e5 !important;
        transition: background-color 0.3s;
      }
      .fc-button-primary:hover {
        background-color: #4338ca !important;
      }
      .fc-button-primary:disabled {
        background-color: #4b5563 !important;
        border-color: #4b5563 !important;
      }
      .fc-button-active {
        background-color: #3730a3 !important;
        border-color: #3730a3 !important;
      }
      
      /* Toolbar Title */
      .fc-toolbar-title {
        color: #ffffff;
      }

      /* Calendar Borders */
      .fc-theme-standard td, .fc-theme-standard th {
        border-color: #374151; /* Gray-700 */
      }

      /* Day Headers */
      .fc-col-header-cell-cushion {
        color: #d1d5db; /* Gray-300 */
        text-decoration: none;
      }

      /* Timegrid time text */
      .fc-timegrid-axis-cushion, .fc-timegrid-slot-label {
        color: #9ca3af; /* Gray-400 */
      }

      /* General text color for events */
      :root {
        --fc-event-text-color: #ffffff;
        --fc-list-event-title-color: #ffffff;
      }
    `}</style>
  );
};


// Mock data for initial events. We will replace this with real data from the database.
const mockEvents = [
  { id: '1', title: 'Reserva - Pista 1', start: '2025-07-03T18:00:00', end: '2025-07-03T19:30:00', backgroundColor: '#3b82f6' },
  { id: '2', title: 'Clase Particular - Pista 2', start: '2025-07-04T10:00:00', end: '2025-07-04T11:00:00', backgroundColor: '#10b981' },
  { id: '3', title: 'Torneo Interno - Pista 3', start: '2025-07-05T09:00:00', end: '2025-07-05T13:00:00', backgroundColor: '#ef4444' },
];

const CalendarView = () => {
  // Handler for when a date is clicked
  const handleDateClick = (arg: any) => {
    // In the future, this could open a modal to create a new reservation
    alert('Has hecho clic en la fecha: ' + arg.dateStr);
  };

  // Handler for when an event is clicked
  const handleEventClick = (arg: any) => {
    // In the future, this could open a modal with the reservation details
    alert('Evento: ' + arg.event.title);
  };

  return (
    <div>
      <CalendarStyles />
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={mockEvents}
        editable={true} // Allows dragging and resizing events
        selectable={true} // Allows selecting time slots
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        // Customizing the look and feel to match our dark theme
        allDaySlot={false} // We don't need the "all-day" slot for court bookings
        slotMinTime="08:00:00" // Earliest time slot
        slotMaxTime="23:00:00" // Latest time slot
        height="75vh" // Set a good height for the calendar
        locale="es" // Set language to Spanish
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
        }}
      />
    </div>
  );
};

export default CalendarView;