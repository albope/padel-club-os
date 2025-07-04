import React from 'react';
import CalendarView from '@/components/reservas/CalendarView';

const ReservasPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Calendario de Reservas</h1>
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <CalendarView />
      </div>
    </div>
  );
};

export default ReservasPage;