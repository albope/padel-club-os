import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Calendar, Users, BarChart, Trophy } from 'lucide-react';

// Stat Card Component
const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
    <div className="bg-indigo-100 rounded-full p-3">
      <Icon className="h-6 w-6 text-indigo-600" />
    </div>
  </div>
);

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  // Protect the route: if no session or no user in session, redirect to login.
  // This check now satisfies TypeScript.
  if (!session || !session.user) {
    redirect('/login');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Dashboard de {session.user.name}
      </h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Reservas de Hoy" value="12" icon={Calendar} />
        <StatCard title="Socios Activos" value="152" icon={Users} />
        <StatCard title="Ocupación Media" value="78%" icon={BarChart} />
        <StatCard title="Ligas Activas" value="3" icon={Trophy} />
      </div>

      {/* More sections can be added here */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800">Actividad Reciente</h2>
        <p className="mt-2 text-gray-600">Próximamente aquí verás las últimas reservas y movimientos...</p>
      </div>
    </div>
  );
};

export default DashboardPage;