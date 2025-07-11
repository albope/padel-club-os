'use client';

import React from 'react';
import { User } from 'next-auth';
import { PlusCircle, Calendar, Users, BarChart, Trophy } from 'lucide-react';
import Link from 'next/link';

// --- Reusable UI Components ---
const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color: string }) => {
    const colorVariants: { [key: string]: string } = {
        blue: 'border-blue-500 text-blue-400',
        green: 'border-green-500 text-green-400',
        purple: 'border-purple-500 text-purple-400',
        yellow: 'border-yellow-500 text-yellow-400',
    };
    return (
        <div className={`p-6 bg-gray-800 rounded-xl shadow-lg border-l-4 ${colorVariants[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                </div>
                <Icon className={`h-8 w-8 ${colorVariants[color]}`} />
            </div>
        </div>
    );
};

// --- Main Client Component ---
interface DashboardClientProps {
  user: User;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ user }) => {
  return (
    <div className="space-y-8">
      {/* The redundant Header section has been removed. */}
      {/* The main Header is now handled by the layout.tsx file. */}
      
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Reservas de Hoy" value="12" icon={Calendar} color="blue" />
          <StatCard title="Socios Activos" value="152" icon={Users} color="green" />
          <StatCard title="Ocupación Media" value="78%" icon={BarChart} color="purple" />
          <StatCard title="Ligas Activas" value="3" icon={Trophy} color="yellow" />
        </div>

        {/* Placeholder for future components like the calendar */}
        <div className="mt-8 bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Calendario de Reservas</h2>
            <p className="text-gray-500 text-center py-12">Próximamente aquí verás el calendario interactivo de reservas...</p>
        </div>
      </main>
    </div>
  );
};

export default DashboardClient;