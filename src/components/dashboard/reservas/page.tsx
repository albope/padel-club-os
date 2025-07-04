import React from 'react';
import CalendarView from '@/components/reservas/CalendarView';

// This is a Server Component. It's stable and its only job
// is to render the layout and the interactive client component.
const ReservasPage = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Calendario de Reservas</h1>
        {/* Future "Add Reservation" button can go here */}
      </div>
      <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
        <CalendarView />
      </div>
    </div>
  );
};

export default ReservasPage;