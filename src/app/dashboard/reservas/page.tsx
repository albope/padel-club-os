import React from 'react';
import CalendarView from '@/components/reservas/CalendarView';
import { db } from '@/lib/db';
import { Booking, Court, User } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

// We define a type for our bookings with the included relations
type BookingWithDetails = Booking & {
  user: { name: string | null };
  court: { name: string };
};

// This function now fetches all necessary data for the reservations page
const getReservasData = async (clubId: string) => {
  try {
    const bookings = await db.booking.findMany({
      where: { clubId },
      include: {
        user: { select: { name: true } },
        court: { select: { name: true } },
      },
    });

    const courts = await db.court.findMany({
      where: { clubId },
      orderBy: { name: 'asc' },
    });

    // For now, we fetch all users. In a real scenario, you'd fetch only club members.
    const users = await db.user.findMany({
      orderBy: { name: 'asc' },
    });

    // Ensure data is serializable
    return JSON.parse(JSON.stringify({ bookings, courts, users }));
  } catch (error) {
    console.error("Failed to fetch reservations data:", error);
    return { bookings: [], courts: [], users: [] };
  }
};

const ReservasPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    // If user has no club, we can't show reservations.
    // Redirect or show a message to create a club first.
    redirect('/dashboard'); 
  }

  const { bookings, courts, users } = await getReservasData(session.user.clubId);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Calendario de Reservas</h1>
      </div>
      <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
        {/* We pass all the necessary data down to the client component */}
        <CalendarView 
          initialBookings={bookings} 
          courts={courts}
          users={users}
        />
      </div>
    </div>
  );
};

export default ReservasPage;