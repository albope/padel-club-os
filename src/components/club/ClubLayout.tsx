'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  CalendarDays, Users, Trophy, User, Home, LogIn, Newspaper,
  DollarSign, Medal, MoreHorizontal, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

interface ClubInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  bannerUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  enableOpenMatches: boolean;
  enablePlayerBooking: boolean;
}

interface ClubLayoutProps {
  club: ClubInfo;
  children: React.ReactNode;
}

const MAX_MOBILE_ITEMS = 4;

export default function ClubLayout({ club, children }: ClubLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const scrollDir = useScrollDirection();
  const [sheetOpen, setSheetOpen] = useState(false);
  const basePath = `/club/${club.slug}`;
  const color = club.primaryColor || '#4f46e5';

  const navItems = [
    { label: 'Inicio', href: basePath, icon: Home },
    ...(club.enablePlayerBooking
      ? [{ label: 'Reservar', href: `${basePath}/reservar`, icon: CalendarDays }]
      : []),
    ...(club.enableOpenMatches
      ? [{ label: 'Partidas', href: `${basePath}/partidas`, icon: Users }]
      : []),
    { label: 'Competiciones', href: `${basePath}/competiciones`, icon: Trophy },
    { label: 'Rankings', href: `${basePath}/rankings`, icon: Medal },
    { label: 'Noticias', href: `${basePath}/noticias`, icon: Newspaper },
    { label: 'Tarifas', href: `${basePath}/tarifas`, icon: DollarSign },
  ];

  const mainMobileItems = navItems.slice(0, MAX_MOBILE_ITEMS);
  const overflowItems = navItems.slice(MAX_MOBILE_ITEMS);

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath;
    return pathname.startsWith(href);
  };

  const isPlayerOfClub = session?.user?.clubId === club.id;

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        '--club-primary': color,
        '--club-primary-shadow': `${color}66`,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header
        className={cn(
          'sticky top-0 z-50',
          'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          'border-b border-border/60',
          'club-header-transition',
          scrollDir === 'down' && 'club-header-hidden md:[transform:none]',
        )}
      >
        {/* Linea de acento gradient superior */}
        <div
          className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${color}60 30%, ${color}90 50%, ${color}60 70%, transparent 100%)`,
          }}
        />

        <div className="mx-auto max-w-5xl flex items-center justify-between h-14 px-4">
          {/* Logo + nombre */}
          <Link href={basePath} className="flex items-center gap-2.5 group shrink-0">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={club.name}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-offset-2 ring-offset-background"
                style={{ borderColor: color, boxShadow: `0 0 0 2px ${color}` }}
              />
            ) : (
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                }}
              >
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-display font-bold text-foreground truncate max-w-[160px] hidden sm:inline tracking-tight">
              {club.name}
            </span>
          </Link>

          {/* Desktop nav — solo texto, sin iconos (excepto Home) */}
          <nav className="hidden md:flex items-center">
            <TooltipProvider delayDuration={200}>
              {navItems.map((item) => {
                const active = isActive(item.href);
                const isHome = item.href === basePath;

                if (isHome) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          data-active={active}
                          className={cn(
                            'club-nav-item relative flex items-center justify-center w-10 h-14',
                            'transition-colors duration-150',
                            active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <item.icon className={cn('h-4 w-4 transition-transform duration-200', active && 'scale-110')} />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Inicio</TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-active={active}
                    className={cn(
                      'club-nav-item relative flex items-center h-14 px-3',
                      'text-sm font-medium tracking-[-0.01em]',
                      'transition-colors duration-150',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </TooltipProvider>
          </nav>

          {/* Auth area */}
          <div className="flex items-center gap-2 shrink-0">
            {isPlayerOfClub && <NotificationBell urlBase={basePath} />}
            {isPlayerOfClub ? (
              <Link
                href={`${basePath}/perfil`}
                className={cn(
                  'flex items-center gap-2 h-8 pl-1 pr-3 rounded-full text-sm font-medium',
                  'transition-colors duration-150',
                  pathname.includes('/perfil')
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
              >
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {session?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <span className="hidden sm:inline whitespace-nowrap">Mi perfil</span>
              </Link>
            ) : (
              <Link
                href={`${basePath}/login`}
                className="club-cta-btn inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Acceder</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/60">
        <div className="flex items-stretch h-16">
          {/* Items principales */}
          {mainMobileItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'flex-1 py-2 text-[10px] font-medium',
                  'transition-colors duration-200',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
                style={active ? { color } : undefined}
              >
                <span className="club-bottom-pill" />
                <item.icon className={cn('h-5 w-5 transition-transform duration-200', active && 'scale-110')} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Auth item */}
          {isPlayerOfClub ? (
            <Link
              href={`${basePath}/perfil`}
              data-active={pathname.includes('/perfil')}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5',
                'flex-1 py-2 text-[10px] font-medium',
                'transition-colors duration-200',
                pathname.includes('/perfil') ? 'text-foreground' : 'text-muted-foreground',
              )}
              style={pathname.includes('/perfil') ? { color } : undefined}
            >
              <span className="club-bottom-pill" />
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: color }}
              >
                {session?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <span>Perfil</span>
            </Link>
          ) : (
            <Link
              href={`${basePath}/login`}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors duration-200"
            >
              <LogIn className="h-5 w-5" />
              <span>Acceder</span>
            </Link>
          )}

          {/* Overflow "Mas" */}
          {overflowItems.length > 0 && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-0.5',
                    'flex-1 py-2 text-[10px] font-medium text-muted-foreground',
                    'transition-colors duration-200',
                  )}
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span>Mas</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-sm font-semibold text-left">Mas opciones</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-2 pb-6">
                  {overflowItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSheetOpen(false)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl transition-colors duration-150',
                          active
                            ? 'bg-muted font-medium'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                        style={active ? { color } : undefined}
                      >
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                          style={active
                            ? { backgroundColor: `${color}20`, color }
                            : undefined
                          }
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{item.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-40 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16" />
    </div>
  );
}
