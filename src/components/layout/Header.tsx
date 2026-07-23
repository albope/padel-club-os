'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { temaMarcadorActivo } from '@/lib/feature-flags';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { urlAvatar } from '@/lib/avatar';

const Header = () => {
  const { data: session, status } = useSession();
  const t = useTranslations('nav');
  const user = session?.user;
  const temaMarcador = temaMarcadorActivo();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b',
        // «Marcador»: header 56px solido, sin glassmorphism
        temaMarcador
          ? 'bg-background'
          : 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-4 sm:px-6',
          temaMarcador ? 'h-14' : 'h-16'
        )}
      >
        <div className="flex items-center gap-2">
          <MobileSidebar />
          <Breadcrumbs />
        </div>

        <div className="flex items-center gap-2">
          {status === 'authenticated' && <GlobalSearch />}
          <LanguageSelector />
          <ThemeToggle />

          {status === 'authenticated' && <NotificationBell />}

          {status === 'loading' && (
            <Skeleton className="h-9 w-9 rounded-full" />
          )}

          {status === 'authenticated' && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 overflow-hidden">
                  <Image
                    className="h-full w-full rounded-full object-cover"
                    src={user.image || urlAvatar(user.name || 'U', '6366f1')}
                    alt={user.name || 'Avatar de usuario'}
                    width={44}
                    height={44}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.clubName || user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/ajustes" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {t('ajustes')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {status === 'unauthenticated' && (
            <Button asChild size="sm">
              <Link href="/login">{t('signIn')}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
