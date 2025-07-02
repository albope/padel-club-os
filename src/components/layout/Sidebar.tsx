'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Trophy, Users } from 'lucide-react';
import React from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reservas', href: '/dashboard/reservas', icon: Calendar },
  { name: 'Ligas', href: '/dashboard/ligas', icon: Trophy },
  { name: 'Socios', href: '/dashboard/socios', icon: Users },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Menú Principal</h2>
      </div>
      <nav className="flex-grow p-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.name}>
              <Link href={item.href}>
                <span
                  className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-6 w-6" />
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