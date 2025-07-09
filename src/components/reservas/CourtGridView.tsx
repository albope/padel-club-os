'use client';

import React from 'react';
import { Court, Booking } from '@prisma/client';
import { PlusCircle, Clock } from 'lucide-react';
import { BookingWithDetails } from './CalendarView'; // Import the single source of truth

interface CourtGridViewProps {
  courts: Court[];
  bookings: BookingWithDetails[];
  selectedDate: Date;
  onSlotClick: (date: Date, courtId: string) => void;
  onBookingClick: (booking: BookingWithDetails) => void;
}

// Helper to generate time slots for a day
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
  const timeSlots = generateTimeSlots(9, 23, 90); // 90-minute slots from 9:00 to 22:30

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {courts.map(court => {
        // Filter bookings for the current court and selected date
        const courtBookings = bookings.filter(b => {
          const bookingDate = new Date(b.startTime);
          return b.courtId === court.id &&
                 bookingDate.getDate() === selectedDate.getDate() &&
                 bookingDate.getMonth() === selectedDate.getMonth() &&
                 bookingDate.getFullYear() === selectedDate.getFullYear();
        });

        return (
          <div key={court.id} className="bg-gray-800 rounded-xl shadow-lg flex flex-col">
            <h3 className="p-4 text-center font-bold text-white border-b border-gray-700 bg-gray-700/50 rounded-t-xl">
              {court.name}
            </h3>
            <div className="p-4 space-y-3">
              {timeSlots.map(slot => {
                const [hour, minute] = slot.split(':').map(Number);
                const slotDate = new Date(selectedDate);
                slotDate.setHours(hour, minute, 0, 0);

                const booking = courtBookings.find(b => new Date(b.startTime).getTime() === slotDate.getTime());

                if (booking) {
                  // --- CHANGE START ---
                  // Calculate end time and format the time range string
                  const startTime = new Date(booking.startTime);
                  const endTime = new Date(booking.endTime);
                  const startTimeString = startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                  const endTimeString = endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                  const timeRange = `${startTimeString} - ${endTimeString}`;
                  // --- CHANGE END ---
                  
                  // Render a booked slot
                  return (
                    <div
                      key={slot}
                      onClick={() => onBookingClick(booking)}
                      className="bg-indigo-600 rounded-lg p-3 text-white cursor-pointer hover:bg-indigo-500 transition-colors"
                    >
                      <p className="font-semibold text-sm">{booking.user.name || 'Reservado'}</p>
                      <p className="text-xs text-indigo-200">{timeRange}</p>
                    </div>
                  );
                } else {
                  // Render a free slot
                  return (
                    <div
                      key={slot}
                      onClick={() => onSlotClick(slotDate, court.id)}
                      className="bg-gray-700/50 rounded-lg p-3 text-gray-400 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="text-sm">{slot}</span>
                      </div>
                      <PlusCircle className="h-5 w-5 text-gray-500" />
                    </div>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CourtGridView;