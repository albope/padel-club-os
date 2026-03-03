'use client';

import React, { useState } from 'react';
import { User } from 'next-auth';
import { Booking, Court, type User as PrismaUser } from '@prisma/client';
import { useTranslations, useLocale } from 'next-intl';
import BookingModal from '@/components/reservas/BookingModal';
import AgendaDelDia from '@/components/dashboard/AgendaDelDia';
import IngresosSemana from '@/components/dashboard/IngresosSemana';
import { PlusCircle, Calendar, Users, BarChart, Euro, Clock, ArrowRight, ChevronLeft, ChevronRight, Info, Megaphone, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BroadcastDialog from '@/components/dashboard/BroadcastDialog';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import EmptyState from '@/components/onboarding/EmptyState';

const StatCard = ({ title, value, icon: Icon, tooltipText }: { title: string, value: string, icon: React.ElementType, tooltipText?: string }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {tooltipText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex" aria-label="Mas informacion">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type UpcomingBooking = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  guestName: string | null;
  court: { name: string };
  user: { name: string | null } | null;
};

type TodayBooking = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  guestName: string | null;
  court: { name: string };
  user: { name: string | null } | null;
};

interface DatoIngresoDiario {
  fecha: string;
  cobrado: number;
  pendiente: number;
}

interface DashboardClientProps {
  user: User;
  clubName: string | null;
  upcomingBookings: UpcomingBooking[];
  stats: {
    bookingsToday: number;
    activeMembers: number;
    activeLeagues: number;
    occupancyRate: number;
  };
  courts: Court[];
  users: PrismaUser[];
  todayBookings: TodayBooking[];
  openingTime: string;
  closingTime: string;
  onboardingPasos: { id: string; completado: boolean; href: string }[];
  clubSlug: string;
  ingresosSemana: DatoIngresoDiario[];
  ingresoHoy: number;
  ingresosMes: number;
  pagosPendientes: number;
}

const DashboardClient: React.FC<DashboardClientProps> = ({
  user, clubName, upcomingBookings, stats, courts, users,
  todayBookings, openingTime, closingTime, onboardingPasos, clubSlug,
  ingresosSemana, ingresoHoy, ingresosMes, pagosPendientes,
}) => {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const locale = useLocale();
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInfoForModal, setSelectedInfoForModal] = useState<Date | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const formatearMoneda = (cantidad: number) =>
    new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cantidad);

  const handleOpenModal = () => {
    setSelectedInfoForModal(new Date());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInfoForModal(null);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5;
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = upcomingBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(upcomingBookings.length / bookingsPerPage);
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  const UpcomingBookingItem = ({ booking }: { booking: UpcomingBooking }) => {
    const startTime = new Date(booking.startTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(booking.endTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' });
    const timeRange = `${startTime} - ${endTime}`;

    if (booking.status === 'provisional') {
      return (
        <li className="flex items-center space-x-4 py-3 border-b last:border-b-0 group cursor-pointer hover:bg-accent -mx-6 px-6 transition-colors">
          <div className="p-2 bg-muted rounded-full">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{booking.court.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{t('openMatch')}</p>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {t('openBadge')}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{timeRange}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </li>
      );
    }

    const displayName = booking.user?.name || booking.guestName || t('guest');
    const userType = booking.user ? t('member') : t('guest');

    return (
      <li className="flex items-center space-x-4 py-3 border-b last:border-b-0 group cursor-pointer hover:bg-accent -mx-6 px-6 transition-colors">
        <div className="p-2 bg-muted rounded-full">
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{booking.court.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{displayName}</p>
            <Badge variant="secondary" className={`text-xs ${userType === t('member') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
              {userType}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{timeRange}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </li>
    );
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {t('welcomeTo', { club: clubName || 'tu club' })}
            </h1>
            <p className="mt-1 text-muted-foreground">{t('clubSummary', { club: clubName || 'tu club' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setBroadcastOpen(true)}>
              <Megaphone className="mr-2 h-5 w-5" />
              {t('communication')}
            </Button>
            <Button onClick={handleOpenModal}>
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('newBooking')}
            </Button>
          </div>
        </div>

        <div>
          {onboardingPasos.length > 0 && !onboardingPasos.every(p => p.completado) && (
            <OnboardingChecklist pasos={onboardingPasos} clubSlug={clubSlug} />
          )}

          {/* Fila 1: Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <StatCard title={t('bookingsToday')} value={stats.bookingsToday.toString()} icon={Calendar} />
            <StatCard title={t('activeMembers')} value={stats.activeMembers.toString()} icon={Users} />
            <StatCard
              title={t('occupancyToday')}
              value={`${stats.occupancyRate}%`}
              icon={BarChart}
              tooltipText={t('occupancyTooltip')}
            />
            <StatCard
              title={t('revenueToday')}
              value={formatearMoneda(ingresoHoy)}
              icon={Euro}
              tooltipText={t('revenueTodayTooltip')}
            />
          </div>

          {/* Fila 2: Agenda + Grafico ingresos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <AgendaDelDia
              bookings={todayBookings}
              openingTime={openingTime}
              closingTime={closingTime}
            />

            <IngresosSemana data={ingresosSemana} />
          </div>

          {/* Fila 3: Proximas reservas + Resumen financiero */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('upcomingBookings')}</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length > 0 ? (
                  <ul>
                    {currentBookings.map(booking => (
                      <UpcomingBookingItem key={booking.id} booking={booking} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title={t('noUpcomingBookings')}
                    description={t('noUpcomingBookingsDesc')}
                    className="py-12"
                  />
                )}
              </CardContent>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {tc('previous')}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {tc('pageOf', { current: currentPage, total: totalPages })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    {tc('next')}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('financialSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">{t('revenueThisMonth')}</p>
                  </div>
                  <p className="text-3xl font-bold">{formatearMoneda(ingresosMes)}</p>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">{t('pendingPayments')}</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{pagosPendientes}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('pendingPaymentsCount', { count: pagosPendientes })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedInfo={selectedInfoForModal}
        courts={courts}
        users={users}
      />

      <BroadcastDialog open={broadcastOpen} onOpenChange={setBroadcastOpen} />
    </>
  );
};

export default DashboardClient;
