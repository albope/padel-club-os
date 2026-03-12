import React from 'react';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReservasContainer from '@/components/reservas/ReservasContainer';

const getReservasData = async (clubId: string) => {
  try {
    // Bloqueos del dia actual para carga inicial
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);

    const [bookings, courts, users, courtBlocks] = await Promise.all([
      db.booking.findMany({
        where: { clubId },
        include: {
          user: { select: { name: true } },
          court: { select: { name: true } },
          openMatch: {
            select: {
              levelMin: true,
              levelMax: true,
            }
          }
        },
      }),
      db.court.findMany({
        where: { clubId },
        orderBy: { name: 'asc' },
      }),
      db.user.findMany({ where: { clubId }, orderBy: { name: 'asc' } }),
      db.courtBlock.findMany({
        where: {
          clubId,
          startTime: { lt: finDia },
          endTime: { gt: inicioDia },
        },
        select: {
          id: true,
          reason: true,
          note: true,
          startTime: true,
          endTime: true,
          courtId: true,
        },
      }),
    ]);

    // Usamos JSON.parse(JSON.stringify(...)) para evitar errores de serialización
    return JSON.parse(JSON.stringify({ bookings, courts, users, courtBlocks }));
  } catch (error) {
    console.error("Failed to fetch reservations data:", error);
    return { bookings: [], courts: [], users: [], courtBlocks: [] };
  }
};

const ReservasPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) {
    redirect('/dashboard'); 
  }

  const { bookings, courts, users, courtBlocks } = await getReservasData(session.user.clubId);

  return (
    <ReservasContainer
      initialBookings={bookings}
      initialCourtBlocks={courtBlocks}
      courts={courts}
      users={users}
    />
  );
};

export default ReservasPage;