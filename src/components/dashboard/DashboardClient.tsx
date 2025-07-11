'use client';

import React from 'react';
import { User } from 'next-auth';
import { PlusCircle, Calendar, Users, BarChart, Trophy, Clock, ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';
import { Booking, Court } from '@prisma/client';

// --- Reusable UI Components ---
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

// Component for the upcoming booking list item
type UpcomingBooking = Booking & { user: { name: string | null }, court: { name: string } };
const UpcomingBookingItem = ({ booking }: { booking: UpcomingBooking }) => {
  const startTime = new Date(booking.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return (
    <li className="flex items-center space-x-4 py-3 border-b border-gray-700 last:border-b-0 group cursor-pointer hover:bg-gray-700/50 -mx-6 px-6 transition-colors">
      <div className="p-2 bg-gray-700 rounded-full">
        <Clock className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{booking.court.name}</p>
        <p className="text-xs text-gray-400">{booking.user.name || 'Socio'}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-white">{startTime}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
    </li>
  );
};


// --- Main Client Component ---
interface DashboardClientProps {
  user: User;
  upcomingBookings: UpcomingBooking[];
  stats: {
    bookingsToday: number;
    activeMembers: number;
    activeLeagues: number;
    occupancyRate: number;
  };
}

const DashboardClient: React.FC<DashboardClientProps> = ({ user, upcomingBookings, stats }) => {
  return (
    <div className="space-y-8">
      {/* Welcome Message and Main Action Button */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Bienvenido, {user.name}
          </h1>
          <p className="mt-1 text-gray-400">Resumen del club PadelClub OS.</p>
        </div>
        <Link href="/dashboard/reservas/nueva">
          <span className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 transition-colors duration-300 cursor-pointer">
            <PlusCircle className="h-5 w-5" />
            Nueva Reserva
          </span>
        </Link>
      </div>

      {/* Main Content */}
      <main>
        {/* Stats Grid - Now with dynamic data */}
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

        {/* Upcoming Bookings Section */}
        <div className="mt-8 bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Próximas Reservas</h2>
          {upcomingBookings.length > 0 ? (
            <ul>
              {upcomingBookings.map(booking => (
                <UpcomingBookingItem key={booking.id} booking={booking} />
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-12">No hay próximas reservas.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardClient;