import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { User } from 'next-auth';
import { db } from '@/lib/db';

// This function now fetches all necessary data for the dashboard, including a dynamic occupancy rate.
const getDashboardData = async (clubId: string) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all necessary data in parallel for performance
    const [upcomingBookings, bookingsToday, activeMembers, activeLeagues, club] = await Promise.all([
      db.booking.findMany({
        where: { clubId, startTime: { gte: new Date() } },
        take: 5,
        orderBy: { startTime: 'asc' },
        include: { user: { select: { name: true } }, court: { select: { name: true } } }
      }),
      db.booking.findMany({
        where: { clubId, startTime: { gte: startOfDay, lte: endOfDay } }
      }),
      db.user.count({ where: { clubId } }),
      db.league.count({ where: { clubId } }),
      db.club.findUnique({ // Fetch the club details to get opening hours
        where: { id: clubId },
        select: { courts: { select: { id: true } }, openingTime: true, closingTime: true }
      })
    ]);
    
    // --- Calculate Occupancy Rate for Today ---
    let occupancyRate = 0;
    if (club && club.courts.length > 0 && club.openingTime && club.closingTime) {
      const openingHour = parseInt(club.openingTime.split(':')[0]);
      const closingHour = parseInt(club.closingTime.split(':')[0]);
      const totalClubHours = closingHour - openingHour;

      if (totalClubHours > 0) {
        const totalAvailableHours = club.courts.length * totalClubHours;
        const totalBookedHours = bookingsToday.reduce((sum, booking) => {
          const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
          return sum + duration;
        }, 0);
        
        occupancyRate = totalAvailableHours > 0 ? Math.round((totalBookedHours / totalAvailableHours) * 100) : 0;
      }
    }

    const stats = {
      bookingsToday: bookingsToday.length,
      activeMembers,
      activeLeagues,
      occupancyRate,
    };

    return JSON.parse(JSON.stringify({ upcomingBookings, stats }));

  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return { upcomingBookings: [], stats: { bookingsToday: 0, activeMembers: 0, activeLeagues: 0, occupancyRate: 0 } };
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