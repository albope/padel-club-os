'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  CalendarDays, Users, Trophy, User, Home, LogIn, Newspaper, DollarSign, Medal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

export default function ClubLayout({ club, children }: ClubLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
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

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath;
    return pathname.startsWith(href);
  };

  const isPlayerOfClub = session?.user?.clubId === club.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ borderBottom: `2px solid ${color}` }}
      >
        <div className="mx-auto max-w-5xl flex items-center justify-between h-14 px-4">
          <Link href={basePath} className="flex items-center gap-2.5 group">
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

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            <TooltipProvider delayDuration={300}>
              {navItems.map((item) => {
                const active = isActive(item.href);
                const isHome = item.href === basePath;
                return isHome ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                          !active && 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        )}
                        style={active ? {
                          backgroundColor: `${color}20`,
                          color: color,
                        } : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                      active ? 'font-semibold' : 'font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    )}
                    style={active ? {
                      backgroundColor: `${color}20`,
                      color: color,
                    } : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </TooltipProvider>
          </nav>

          {/* Auth button */}
          <div className="flex items-center gap-1.5">
            {isPlayerOfClub && <NotificationBell urlBase={basePath} />}
            {isPlayerOfClub ? (
              <Link
                href={`${basePath}/perfil`}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                  pathname.includes('/perfil') ? 'font-semibold' : 'font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80'
                )}
                style={pathname.includes('/perfil') ? {
                  backgroundColor: `${color}20`,
                  color: color,
                } : undefined}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline whitespace-nowrap">Mi perfil</span>
              </Link>
            ) : (
              <Link
                href={`${basePath}/login`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Entrar</span>
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
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ borderTop: `2px solid ${color}` }}
      >
        <div className="flex items-center justify-around h-14">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors',
                  !active && 'text-muted-foreground'
                )}
                style={active ? { color: color } : undefined}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          {isPlayerOfClub ? (
            <Link
              href={`${basePath}/perfil`}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors',
                !pathname.includes('/perfil') && 'text-muted-foreground'
              )}
              style={pathname.includes('/perfil') ? { color: color } : undefined}
            >
              <User className="h-5 w-5" />
              Perfil
            </Link>
          ) : (
            <Link
              href={`${basePath}/login`}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs text-muted-foreground"
            >
              <LogIn className="h-5 w-5" />
              Entrar
            </Link>
          )}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-14" />
    </div>
  );
}
