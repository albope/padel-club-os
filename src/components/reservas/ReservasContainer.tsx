'use client';

import React, { useState } from 'react';
import { Court, User } from '@prisma/client';
import { Calendar, LayoutGrid } from 'lucide-react';
import CalendarView, { BookingWithDetails } from './CalendarView'; // Import the type from CalendarView
import CourtGridView from './CourtGridView';
import BookingModal from './BookingModal';

interface ReservasContainerProps {
  initialBookings: BookingWithDetails[];
  courts: Court[];
  users: User[];
}

const ReservasContainer: React.FC<ReservasContainerProps> = ({ initialBookings, courts, users }) => {
  const [view, setView] = useState<'calendar' | 'grid'>('grid'); // Default to grid view
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<Date | BookingWithDetails | null>(null);

  const handleSlotClick = (date: Date, courtId: string) => {
    // In the future, we can pre-fill the court in the modal
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Calendario de Reservas</h1>
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