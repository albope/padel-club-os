import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { User } from 'next-auth';
import { db } from '@/lib/db';

// This function now fetches both upcoming bookings and club statistics
const getDashboardData = async (clubId: string) => {
  try {
    // --- Fetch Upcoming Bookings ---
    const upcomingBookings = await db.booking.findMany({
      where: {
        clubId: clubId,
        startTime: { gte: new Date() },
      },
      take: 5,
      orderBy: { startTime: 'asc' },
      include: {
        user: { select: { name: true } },
        court: { select: { name: true } },
      }
    });

    // --- Calculate Statistics ---
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const bookingsToday = await db.booking.count({
      where: {
        clubId: clubId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });

    const activeMembers = await db.user.count({
      where: { clubId: clubId },
    });

    const activeLeagues = await db.league.count({
      where: { clubId: clubId }, // We can add a status field later
    });

    const stats = {
      bookingsToday,
      activeMembers,
      activeLeagues,
    };

    // Ensure all data is serializable
    return JSON.parse(JSON.stringify({ upcomingBookings, stats }));

  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return { upcomingBookings: [], stats: { bookingsToday: 0, activeMembers: 0, activeLeagues: 0 } };
  }
};

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.clubId) {
    redirect('/login');
  }

  const { upcomingBookings, stats } = await getDashboardData(session.user.clubId);

  return <DashboardClient user={session.user} upcomingBookings={upcomingBookings} stats={stats} />;
};

export default DashboardPage;