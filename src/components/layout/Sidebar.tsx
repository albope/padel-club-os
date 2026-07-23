'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { navItems, agruparNavItems } from '@/lib/nav-items';
import { hasPermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { LogoIcon } from '@/components/ui/logo-icon';
import { temaMarcadorActivo } from '@/lib/feature-flags';
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

  if (temaMarcadorActivo()) {
    // Sidebar «Marcador»: tinta, 264px, agrupada por dominio (prototipo 3a/3f)
    return (
      <aside className="w-[264px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-col hidden md:flex">
        <div className="h-14 flex items-center gap-2.5 border-b border-sidebar-border px-4">
          <LogoIcon
            tamano="md"
            className="text-sidebar-primary-foreground"
            claseRelleno="fill-sidebar-primary"
          />
          <span className="font-display text-lg font-bold tracking-tight text-sidebar-primary-foreground">
            PadelClub OS
          </span>
        </div>

        <nav
          aria-label={t('nav.mainNav')}
          className="flex-grow overflow-y-auto px-3 py-4 space-y-5"
        >
          {agruparNavItems(filteredNavItems).map((grupo) => (
            <div key={grupo.key}>
              <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/60">
                {t(grupo.labelKey)}
              </p>
              <ul className="space-y-0.5">
                {grupo.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.nameKey}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] border-l-[3px] text-[13px] transition-colors',
                          active
                            ? 'border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                            : 'border-transparent font-medium hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        {t(item.nameKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    );
  }

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
