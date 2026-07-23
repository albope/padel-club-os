'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';
import { navItems, agruparNavItems } from '@/lib/nav-items';
import { hasPermission } from '@/lib/permissions';
import { temaMarcadorActivo } from '@/lib/feature-flags';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LogoIcon } from '@/components/ui/logo-icon';
import { useState } from 'react';
import type { UserRole } from '@prisma/client';

export function MobileSidebar() {
  const pathname = usePathname();
  const t = useTranslations();
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;
  const [open, setOpen] = useState(false);

  const filteredNavItems = navItems.filter(
    (item) => !item.requiredPermission || (role && hasPermission(role, item.requiredPermission))
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  if (temaMarcadorActivo()) {
    // Version «Marcador»: mismo tratamiento tinta agrupada que la sidebar desktop
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col"
        >
          <SheetHeader className="h-14 shrink-0 flex justify-center border-b border-sidebar-border px-4">
            <SheetTitle className="text-lg font-display font-bold tracking-tight text-sidebar-primary-foreground flex items-center gap-2.5">
              <LogoIcon
                tamano="sm"
                className="text-sidebar-primary-foreground"
                claseRelleno="fill-sidebar-primary"
              />
              PadelClub OS
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
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
                          onClick={() => setOpen(false)}
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
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="h-16 flex items-center justify-center border-b px-6">
          <SheetTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <LogoIcon tamano="sm" />
            PadelClub OS
          </SheetTitle>
        </SheetHeader>
        <nav className="p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.nameKey}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {t(item.nameKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
