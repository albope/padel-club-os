'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { navItems } from '@/lib/nav-items';
import { hasPermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { LogoIcon } from '@/components/ui/logo-icon';
import type { UserRole } from '@prisma/client';
import React from 'react';

const Sidebar = () => {
  const pathname = usePathname();
  const t = useTranslations();
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const filteredNavItems = navItems.filter(
    (item) => !item.requiredPermission || (role && hasPermission(role, item.requiredPermission))
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r bg-sidebar text-sidebar-foreground flex-col hidden md:flex">
      <div className="h-16 flex items-center justify-center border-b">
        <div className="flex items-center gap-2.5">
          <LogoIcon tamano="md" />
          <span className="text-2xl font-bold text-sidebar-primary">PadelClub OS</span>
        </div>
      </div>

      <nav aria-label="Navegacion principal" className="flex-grow p-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.nameKey}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {t(item.nameKey)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
