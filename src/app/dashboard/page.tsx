import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { User } from 'next-auth';
import { db } from '@/lib/db';

const getDashboardData = async (clubId: string) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      upcomingBookings,
      bookingsToday,
      activeMembers,
      activeCompetitions,
      club,
      courts,
      users,
    ] = await Promise.all([
      // --- INICIO DE LA MODIFICACIÓN ---
      db.booking.findMany({
        where: { clubId, startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
        // Usamos 'select' para controlar explícitamente los datos que traemos
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,     // <-- El campo clave que necesitamos
          guestName: true,
          court: {
            select: {
              name: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        },
      }),
      // --- FIN DE LA MODIFICACIÓN ---
      db.booking.findMany({
        where: { clubId, startTime: { gte: startOfDay, lte: endOfDay } },
      }),
      db.user.count({ where: { clubId } }),
      db.competition.count({ where: { clubId } }),
      db.club.findUnique({
        where: { id: clubId },
        select: {
          courts: { select: { id: true } },
          openingTime: true,
          closingTime: true,
        },
      }),
      db.court.findMany({
        where: { clubId },
        orderBy: { name: 'asc' },
      }),
      db.user.findMany({
        where: { clubId },
        orderBy: { name: 'asc' },
      }),
    ]);

    let occupancyRate = 0;
    if (club && club.courts.length > 0 && club.openingTime && club.closingTime) {
        const openingHour = parseInt(club.openingTime.split(':')[0]);
        const closingHour = parseInt(club.closingTime.split(':')[0]);
        const totalClubHours = closingHour - openingHour;

        if (totalClubHours > 0) {
            const totalAvailableHours = club.courts.length * totalClubHours;
            const totalBookedHours = bookingsToday.reduce((sum, booking) => {
            const duration =
                (booking.endTime.getTime() - booking.startTime.getTime()) /
                (1000 * 60 * 60);
            return sum + duration;
            }, 0);

            occupancyRate =
            totalAvailableHours > 0
                ? Math.round((totalBookedHours / totalAvailableHours) * 100)
                : 0;
        }
    }

    const stats = {
      bookingsToday: bookingsToday.length,
      activeMembers,
      activeLeagues: activeCompetitions, // Renombramos la variable para claridad
      occupancyRate,
    };

    return JSON.parse(JSON.stringify({ upcomingBookings, stats, courts, users }));
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return {
      upcomingBookings: [],
      stats: {
        bookingsToday: 0,
        activeMembers: 0,
        activeLeagues: 0,
        occupancyRate: 0,
      },
      courts: [],
      users: [],
    };
  }
};

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.clubId) {
    redirect('/login');
  }

  const { upcomingBookings, stats, courts, users } = await getDashboardData(
    session.user.clubId
  );

  return (
    <DashboardClient
      user={session.user}
      upcomingBookings={upcomingBookings}
      stats={stats}
      courts={courts}
      users={users}
    />
  );
};

export default DashboardPage;