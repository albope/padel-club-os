'use client';

import React from 'react';
import { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import { LogOut, PlusCircle, Calendar, Users, BarChart, Trophy } from 'lucide-react';
import Link from 'next/link';

// --- Reusable UI Components ---
const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color: string }) => {
    const colorVariants: { [key: string]: string } = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        yellow: 'bg-yellow-500',
    };
    return (
        <div className={`p-6 bg-gray-800 rounded-xl shadow-lg border-l-4 border-${color}-500`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                </div>
                <Icon className={`h-8 w-8 text-${color}-400`} />
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
      {/* Header Section */}
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Bienvenido, {user.name}
          </h1>
          <p className="mt-1 text-gray-400">Resumen del club PadelClub OS.</p>
        </div>
        <div className="flex items-center gap-4">
            <Link href="/dashboard/reservas/nueva">
              <span className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 transition-colors duration-300 cursor-pointer">
                <PlusCircle className="h-5 w-5" />
                Nueva Reserva
              </span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
        </div>
      </header>

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