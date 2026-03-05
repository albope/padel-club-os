import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { User } from 'next-auth';
import { db } from '@/lib/db';
import { getLocale } from 'next-intl/server';

const getDashboardData = async (clubId: string) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Rango de 7 dias para grafico de ingresos
    const sieteDiasAtras = new Date();
    sieteDiasAtras.setHours(0, 0, 0, 0);
    sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 6);

    // Inicio del mes para ingresos mensuales
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      upcomingBookings,
      bookingsToday,
      activeMembers,
      activeCompetitions,
      club,
      courts,
      users,
      courtPricingsCount,
      playerCount,
      reservasIngresos7d,
      ingresosMesAgg,
      pagosPendientesCount,
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
        include: {
          court: { select: { name: true } },
          user: { select: { name: true } },
        },
        orderBy: { startTime: 'asc' },
      }),
      db.user.count({ where: { clubId } }),
      db.competition.count({ where: { clubId } }),
      db.club.findUnique({
        where: { id: clubId },
        select: {
          courts: { select: { id: true } },
          openingTime: true,
          closingTime: true,
          // Campos para onboarding checklist
          description: true,
          phone: true,
          email: true,
          logoUrl: true,
          bannerUrl: true,
          primaryColor: true,
          slug: true,
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
      // Queries para onboarding
      db.courtPricing.count({ where: { clubId } }),
      db.user.count({ where: { clubId, role: "PLAYER" } }),
      // Queries de ingresos
      db.booking.findMany({
        where: { clubId, startTime: { gte: sieteDiasAtras }, cancelledAt: null },
        select: { startTime: true, totalPrice: true, paymentStatus: true },
      }),
      db.booking.aggregate({
        where: { clubId, startTime: { gte: inicioMes }, cancelledAt: null, paymentStatus: 'paid' },
        _sum: { totalPrice: true },
      }),
      db.booking.count({
        where: { clubId, cancelledAt: null, paymentStatus: 'pending', startTime: { lte: new Date() } },
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

    // Preparar reservas de hoy para la agenda (con court/user)
    const todayBookings = bookingsToday.map(b => ({
      id: b.id,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      guestName: b.guestName,
      court: b.court,
      user: b.user,
    }));

    // Calcular pasos de onboarding
    const onboardingPasos = [
      {
        id: 'clubInfo',
        completado: !!(club?.description || club?.phone || club?.email),
        href: '/dashboard/ajustes',
      },
      {
        id: 'createCourt',
        completado: courts.length > 0,
        href: '/dashboard/pistas/nueva',
      },
      {
        id: 'configurePricing',
        completado: courtPricingsCount > 0,
        href: courts.length > 0 ? `/dashboard/pistas/${courts[0].id}/precios` : '/dashboard/pistas',
      },
      {
        id: 'customizePortal',
        completado: !!(club?.logoUrl || club?.bannerUrl || (club?.primaryColor && club.primaryColor !== '#4f46e5')),
        href: '/dashboard/ajustes',
      },
      {
        id: 'invitePlayers',
        completado: playerCount > 0,
        href: '',
      },
    ];

    // Procesar ingresos de 7 dias en buckets diarios
    const locale = await getLocale();
    const localeCode = locale === 'es' ? 'es-ES' : 'en-GB';

    const ingresosSemana = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date();
      dia.setHours(0, 0, 0, 0);
      dia.setDate(dia.getDate() - i);
      const siguienteDia = new Date(dia);
      siguienteDia.setDate(siguienteDia.getDate() + 1);

      const reservasDelDia = reservasIngresos7d.filter(
        r => r.startTime >= dia && r.startTime < siguienteDia
      );

      const cobrado = reservasDelDia
        .filter(r => r.paymentStatus === 'paid')
        .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

      const pendiente = reservasDelDia
        .filter(r => r.paymentStatus === 'pending')
        .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

      const fecha = dia.toLocaleDateString(localeCode, { weekday: 'short', day: 'numeric' });
      ingresosSemana.push({ fecha, cobrado, pendiente });
    }

    // Ingresos cobrados de hoy (subconjunto de los 7 dias)
    const ingresoHoy = reservasIngresos7d
      .filter(r => r.startTime >= startOfDay && r.startTime <= endOfDay && r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    const ingresosMes = ingresosMesAgg._sum.totalPrice || 0;

    return JSON.parse(JSON.stringify({
      upcomingBookings,
      stats,
      courts,
      users,
      todayBookings,
      openingTime: club?.openingTime || '09:00',
      closingTime: club?.closingTime || '23:00',
      onboardingPasos,
      clubSlug: club?.slug || '',
      ingresosSemana,
      ingresoHoy,
      ingresosMes,
      pagosPendientes: pagosPendientesCount,
    }));
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
      todayBookings: [],
      openingTime: '09:00',
      closingTime: '23:00',
      onboardingPasos: [],
      clubSlug: '',
      ingresosSemana: [],
      ingresoHoy: 0,
      ingresosMes: 0,
      pagosPendientes: 0,
    };
  }
};

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.clubId) {
    redirect('/login');
  }

  const {
    upcomingBookings, stats, courts, users, todayBookings,
    openingTime, closingTime, onboardingPasos, clubSlug,
    ingresosSemana, ingresoHoy, ingresosMes, pagosPendientes,
  } = await getDashboardData(session.user.clubId);

  return (
    <DashboardClient
      user={session.user}
      clubName={session.user.clubName || null}
      upcomingBookings={upcomingBookings}
      stats={stats}
      courts={courts}
      users={users}
      todayBookings={todayBookings}
      openingTime={openingTime}
      closingTime={closingTime}
      onboardingPasos={onboardingPasos}
      clubSlug={clubSlug}
      ingresosSemana={ingresosSemana}
      ingresoHoy={ingresoHoy}
      ingresosMes={ingresosMes}
      pagosPendientes={pagosPendientes}
    />
  );
};

export default DashboardPage;