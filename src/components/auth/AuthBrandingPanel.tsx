'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  CalendarCheck2,
  Check,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { LogoIcon } from '@/components/ui/logo-icon';

interface AuthBrandingPanelProps {
  modo: 'registro' | 'login';
}

/**
 * Panel de acceso «Marcador».
 *
 * Es una cabecera de producto compacta, no una segunda landing: tinta, marca
 * verde, geometría de pista y una única lista de capacidades.
 */
export default function AuthBrandingPanel({ modo }: AuthBrandingPanelProps) {
  const t = useTranslations('authBranding');

  const capacidades = [
    { icono: CalendarCheck2, texto: t('realTimeBookings') },
    { icono: Trophy, texto: t('leaguesTournaments') },
    { icono: BarChart3, texto: t('clubAnalytics') },
    { icono: ShieldCheck, texto: t('multiRoleSecure') },
  ];

  const garantias = [t('noLockIn'), t('support247'), t('gdprCompliant')];

  return (
    <aside className="relative hidden min-h-screen w-[50%] overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-primary-foreground lg:flex xl:w-[53%]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/2 h-[560px] w-[392px] -translate-y-1/2 rounded-[48px] border border-sidebar-border/80 opacity-60"
      >
        <div className="absolute inset-x-0 top-1/2 border-t border-sidebar-border" />
        <div className="absolute inset-y-[22%] left-1/2 border-l border-sidebar-border" />
        <div className="absolute inset-x-0 top-[22%] border-t border-sidebar-border/70" />
        <div className="absolute inset-x-0 bottom-[22%] border-t border-sidebar-border/70" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col px-10 py-8 xl:px-14 xl:py-10">
        <Link href="/" className="inline-flex w-fit items-center gap-2.5">
          <LogoIcon
            tamano="lg"
            className="text-sidebar-primary-foreground"
            claseRelleno="fill-sidebar-primary"
          />
          <span className="font-display text-lg font-bold tracking-tight text-sidebar-primary-foreground">
            PadelClub OS
          </span>
        </Link>

        <div className="my-auto max-w-[570px] py-12">
          <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-primary">
            <span className="h-2 w-2 rounded-[2px] bg-sidebar-primary" />
            {modo === 'registro' ? t('trialBadge') : t('managementPortal')}
          </div>

          <h1 className="font-display max-w-[520px] text-4xl font-bold leading-[1.04] tracking-[-0.035em] text-sidebar-primary-foreground xl:text-5xl">
            {modo === 'registro'
              ? `${t('platformTitle')} ${t('platformHighlight')}`
              : t('clubControl')}
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-sidebar-foreground">
            {modo === 'registro' ? t('registerSubtitle') : t('loginSubtitle')}
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-2 overflow-hidden rounded-[var(--radius-module)] border border-sidebar-border bg-sidebar-border">
            {capacidades.map(({ icono: Icono, texto }) => (
              <div
                key={texto}
                className="flex min-h-20 items-center gap-3 bg-sidebar px-4 py-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-sidebar-accent text-sidebar-primary">
                  <Icono className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-semibold leading-snug text-sidebar-primary-foreground">
                  {texto}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-sidebar-border pt-5">
          {garantias.map((garantia) => (
            <span
              key={garantia}
              className="inline-flex items-center gap-1.5 text-xs text-sidebar-foreground"
            >
              <Check className="h-3.5 w-3.5 text-sidebar-primary" strokeWidth={2} />
              {garantia}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
