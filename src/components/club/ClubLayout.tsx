'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  CalendarDays, Users, Trophy, User, Home, LogIn, Newspaper, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/NotificationBell';

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
    { label: 'Noticias', href: `${basePath}/noticias`, icon: Newspaper },
    { label: 'Tarifas', href: `${basePath}/tarifas`, icon: DollarSign },
  ];

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath;
    return pathname.startsWith(href);
  };

  const isLoggedIn = !!session?.user;
  const isPlayerOfClub = session?.user?.clubId === club.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl flex items-center justify-between h-14 px-4">
          <Link href={basePath} className="flex items-center gap-2">
            {club.logoUrl ? (
              <img src={club.logoUrl} alt={club.name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: color }}
              >
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-foreground truncate max-w-[160px]">
              {club.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    !active && 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  style={active ? {
                    backgroundColor: `${color}1a`,
                    color: color,
                  } : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth button */}
          <div className="flex items-center gap-2">
            {isPlayerOfClub && <NotificationBell urlBase={basePath} />}
            {isPlayerOfClub ? (
              <Link
                href={`${basePath}/perfil`}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  !pathname.includes('/perfil') && 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                style={pathname.includes('/perfil') ? {
                  backgroundColor: `${color}1a`,
                  color: color,
                } : undefined}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Mi perfil</span>
              </Link>
            ) : (
              <Link
                href={`${basePath}/login`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
