'use client';

import React, { useState } from 'react';
import { User } from 'next-auth';
import { Booking, Court, type User as PrismaUser } from '@prisma/client';
import BookingModal from '@/components/reservas/BookingModal';
import { PlusCircle, Calendar, Users, BarChart, Trophy, Clock, ArrowRight, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
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

const UpcomingBookingItem = ({ booking }: { booking: UpcomingBooking }) => {
  const startTime = new Date(booking.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(booking.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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
            <p className="text-xs text-muted-foreground">Partida Abierta</p>
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Abierta
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

  const displayName = booking.user?.name || booking.guestName || 'Invitado';
  const userType = booking.user ? 'Socio' : 'Invitado';

  return (
    <li className="flex items-center space-x-4 py-3 border-b last:border-b-0 group cursor-pointer hover:bg-accent -mx-6 px-6 transition-colors">
      <div className="p-2 bg-muted rounded-full">
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{booking.court.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{displayName}</p>
          <Badge variant="secondary" className={`text-xs ${userType === 'Socio' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
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


interface DashboardClientProps {
  user: User;
  upcomingBookings: UpcomingBooking[];
  stats: {
    bookingsToday: number;
    activeMembers: number;
    activeLeagues: number;
    occupancyRate: number;
  };
  courts: Court[];
  users: PrismaUser[];
}

const DashboardClient: React.FC<DashboardClientProps> = ({ user, upcomingBookings, stats, courts, users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInfoForModal, setSelectedInfoForModal] = useState<Date | null>(null);

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

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Bienvenido, {user.name}
            </h1>
            <p className="mt-1 text-muted-foreground">Resumen del club PadelClub OS.</p>
          </div>
          <Button onClick={handleOpenModal}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Nueva Reserva
          </Button>
        </div>

        <main>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Reservas de Hoy" value={stats.bookingsToday.toString()} icon={Calendar} />
            <StatCard title="Socios Activos" value={stats.activeMembers.toString()} icon={Users} />
            <StatCard
              title="Ocupacion (Hoy)"
              value={`${stats.occupancyRate}%`}
              icon={BarChart}
              tooltipText="Porcentaje de horas reservadas sobre el total de horas disponibles hoy."
            />
            <StatCard title="Competiciones Activas" value={stats.activeLeagues.toString()} icon={Trophy} />
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Proximas Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length > 0 ? (
                <ul>
                  {currentBookings.map(booking => (
                    <UpcomingBookingItem key={booking.id} booking={booking} />
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-12">No hay proximas reservas.</p>
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
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {currentPage} de {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        </main>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedInfo={selectedInfoForModal}
        courts={courts}
        users={users}
      />
    </>
  );
};

export default DashboardClient;
