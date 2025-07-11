'use client';

import React, { useState } from 'react';
import { User } from 'next-auth'; // Este es el User de la sesión (NextAuth)

// --- AÑADIDO ---: Importamos los tipos de Prisma, usando un alias para User.
import { Booking, Court, type User as PrismaUser } from '@prisma/client'; 

import BookingModal from '@/components/reservas/BookingModal';
import { PlusCircle, Calendar, Users, BarChart, Trophy, Clock, ArrowRight, ChevronLeft, ChevronRight, Info } from 'lucide-react';

// ... (El código de StatCard y UpcomingBookingItem no cambia) ...

const StatCard = ({ title, value, icon: Icon, color, tooltipText }: { title: string, value: string, icon: React.ElementType, color: string, tooltipText?: string }) => {
    const colorVariants: { [key: string]: string } = {
        blue: 'border-blue-500 text-blue-400',
        green: 'border-green-500 text-green-400',
        purple: 'border-purple-500 text-purple-400',
        yellow: 'border-yellow-500 text-yellow-400',
    };
    return (
        <div className={`relative group p-6 bg-gray-800 rounded-xl shadow-lg border-l-4 ${colorVariants[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-400">{title}</p>
                      {tooltipText && <Info className="h-4 w-4 text-gray-500" />}
                    </div>
                    <p className="text-3xl font-bold text-white">{value}</p>
                </div>
                <Icon className={`h-8 w-8 ${colorVariants[color]}`} />
            </div>
            {tooltipText && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-900 border border-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                {tooltipText}
              </div>
            )}
        </div>
    );
};

type UpcomingBooking = Booking & {
  user: { name: string | null } | null;
  court: { name: string };
};

const UpcomingBookingItem = ({ booking }: { booking: UpcomingBooking }) => {
  const startTime = new Date(booking.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(booking.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const timeRange = `${startTime} - ${endTime}`;
  const displayName = booking.user?.name || booking.guestName || 'Invitado';
  const userType = booking.user ? 'Socio' : 'Invitado';

  return (
    <li className="flex items-center space-x-4 py-3 border-b border-gray-700 last:border-b-0 group cursor-pointer hover:bg-gray-700/50 -mx-6 px-6 transition-colors">
      <div className="p-2 bg-gray-700 rounded-full">
        <Clock className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{booking.court.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400">{displayName}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${userType === 'Socio' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
            {userType}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-white">{timeRange}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
    </li>
  );
};


interface DashboardClientProps {
  user: User; // <-- Este es User de NextAuth, se queda igual.
  upcomingBookings: UpcomingBooking[];
  stats: {
    bookingsToday: number;
    activeMembers: number;
    activeLeagues: number;
    occupancyRate: number;
  };
  courts: Court[];
  // --- MODIFICADO ---: Usamos el alias para el array de usuarios de Prisma.
  users: PrismaUser[];
}

// --- MODIFICADO ---: Usamos la interfaz actualizada.
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
  const bookingsPerPage = 10;
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
            <h1 className="text-3xl font-bold text-white">
              Bienvenido, {user.name}
            </h1>
            <p className="mt-1 text-gray-400">Resumen del club PadelClub OS.</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 transition-colors duration-300 cursor-pointer"
          >
            <PlusCircle className="h-5 w-5" />
            Nueva Reserva
          </button>
        </div>

        <main>
          {/* ... El resto del código no cambia ... */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Reservas de Hoy" value={stats.bookingsToday.toString()} icon={Calendar} color="blue" />
              <StatCard title="Socios Activos" value={stats.activeMembers.toString()} icon={Users} color="green" />
              <StatCard 
                title="Ocupación (Hoy)" 
                value={`${stats.occupancyRate}%`} 
                icon={BarChart} 
                color="purple"
                tooltipText="Porcentaje de horas reservadas sobre el total de horas disponibles hoy."
              />
              <StatCard title="Ligas Activas" value={stats.activeLeagues.toString()} icon={Trophy} color="yellow" />
          </div>

          <div className="mt-8 bg-gray-800 rounded-xl shadow-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Próximas Reservas</h2>
              {upcomingBookings.length > 0 ? (
                <ul>
                  {currentBookings.map(booking => (
                    <UpcomingBookingItem key={booking.id} booking={booking} />
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-12">No hay próximas reservas.</p>
              )}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-700 px-6 py-3">
                <button 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <span className="text-sm text-gray-400">
                  Página {currentPage} de {totalPages}
                </span>
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Esta llamada ahora es correcta porque `users` tiene el tipo PrismaUser[] */}
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