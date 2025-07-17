import React from 'react';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReservasContainer from '@/components/reservas/ReservasContainer';

const getReservasData = async (clubId: string) => {
  try {
    const bookings = await db.booking.findMany({
      where: { clubId },
      include: {
        user: { select: { name: true } },
        court: { select: { name: true } },
        // --- AÑADIDO: Incluimos los datos de la partida abierta asociada ---
        openMatch: {
          select: {
            levelMin: true,
            levelMax: true,
          }
        }
      },
    });
    const courts = await db.court.findMany({
      where: { clubId },
      orderBy: { name: 'asc' },
    });
    const users = await db.user.findMany({ where: { clubId }, orderBy: { name: 'asc' } });
    
    // Usamos JSON.parse(JSON.stringify(...)) para evitar errores de serialización
    return JSON.parse(JSON.stringify({ bookings, courts, users }));
  } catch (error) {
    console.error("Failed to fetch reservations data:", error);
    return { bookings: [], courts: [], users: [] };
  }
};

const ReservasPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/dashboard'); 
  }

  const { bookings, courts, users } = await getReservasData(session.user.clubId);

  return (
    <ReservasContainer 
      initialBookings={bookings}
      courts={courts}
      users={users}
    />
  );
};

export default ReservasPage;