'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Trophy, Users, Fence, Settings } from 'lucide-react'; // Eliminamos BarChart que no se usa
import React from 'react';


const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reservas', href: '/dashboard/reservas', icon: Calendar },
  { name: 'Pistas', href: '/dashboard/pistas', icon: Fence },
  { name: 'Competiciones', href: '/dashboard/competitions', icon: Trophy }, 
  { name: 'Socios', href: '/dashboard/socios', icon: Users },
  { name: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex-col hidden md:flex">
      <div className="h-16 flex items-center justify-center border-b border-gray-700/50">
        <h1 className="text-2xl font-bold text-white">PadelClub OS</h1>
      </div>
      
      <nav className="flex-grow p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link href={item.href}>
                <span
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
                    pathname.startsWith(item.href) && item.href !== '/dashboard' || pathname === item.href
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;