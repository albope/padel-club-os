'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  CalendarDays, Users, Trophy, Clock, MapPin, Phone, Mail,
  Newspaper, ChevronRight, Instagram, Facebook,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ClubHomeProps {
  club: {
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    openingTime: string | null;
    closingTime: string | null;
    primaryColor: string | null;
    bannerUrl: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    enableOpenMatches: boolean;
    enablePlayerBooking: boolean;
  };
  openMatches: any[];
  competitions: any[];
  news: any[];
}

export default function ClubHome({ club, openMatches, competitions, news }: ClubHomeProps) {
  const params = useParams();
  const t = useTranslations('club');
  const tComp = useTranslations('competitions');
  const locale = useLocale();
  const localeCode = locale === 'en' ? 'en-GB' : 'es-ES';
  const basePath = `/club/${params.slug}`;
  const color = club.primaryColor || '#4f46e5';

  return (
    <div className="space-y-8">
      {/* Hero */}
      {club.bannerUrl ? (
        <div
          className="relative rounded-2xl overflow-hidden h-56 sm:h-72 flex items-end shadow-xl"
          style={{
            backgroundImage: `url(${club.bannerUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: `linear-gradient(135deg, ${color}40 0%, transparent 60%)` }}
          />
          <div className="relative z-10 p-6 sm:p-8 w-full">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2">
              {t('welcomeTo')}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              {club.name}
            </h1>
            {club.description && (
              <p className="text-white/70 max-w-2xl mt-2 text-sm sm:text-base">
                {club.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
          style={{
            background: `linear-gradient(135deg, ${color}12 0%, transparent 60%)`,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {t('welcomeTo')}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {club.name}
          </h1>
          {club.description && (
            <p className="text-muted-foreground max-w-2xl mt-2">{club.description}</p>
          )}
          <div className="club-accent-line mt-4" />
        </div>
      )}

      {/* Acciones rapidas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {club.enablePlayerBooking && (
          <Link href={`${basePath}/reservar`} className="group">
            <div className="club-card p-5 flex items-center gap-4 cursor-pointer">
              <div
                className="club-icon-circle h-14 w-14 shrink-0"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
              >
                <CalendarDays className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-foreground text-base">
                  {t('bookCourtAction')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('findYourTime')}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground club-arrow-hover shrink-0" />
            </div>
          </Link>
        )}

        {club.enableOpenMatches && (
          <Link href={`${basePath}/partidas`} className="group">
            <div className="club-card p-5 flex items-center gap-4 cursor-pointer">
              <div
                className="club-icon-circle h-14 w-14 shrink-0"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
              >
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-foreground text-base">
                  {t('openMatchesAction')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('joinMatch')}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground club-arrow-hover shrink-0" />
            </div>
          </Link>
        )}

        <Link href={`${basePath}/competiciones`} className="group">
          <div className="club-card p-5 flex items-center gap-4 cursor-pointer">
            <div
              className="club-icon-circle h-14 w-14 shrink-0"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
            >
              <Trophy className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-base">
                {t('competitionsAction')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('leaguesAndTournaments')}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground club-arrow-hover shrink-0" />
          </div>
        </Link>
      </div>

      {/* Partidas + Competiciones */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Proximas partidas abiertas */}
        {club.enableOpenMatches && (
          <div className="club-card overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color }} />
                <h2 className="font-display font-bold text-base uppercase tracking-wide">
                  {t('upcomingMatches')}
                </h2>
              </div>
              <Link href={`${basePath}/partidas`}>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  {t('viewAll')} <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="p-5">
              {openMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t('noUpcomingMatches')}</p>
              ) : (
                <div className="space-y-3">
                  {openMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border-l-3 transition-colors hover:bg-muted/70"
                      style={{ borderLeftColor: color }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-medium">{match.court.name}</Badge>
                          <span className="text-sm font-medium">
                            {new Date(match.matchTime).toLocaleDateString(localeCode, {
                              weekday: 'short', day: 'numeric', month: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(match.matchTime).toLocaleTimeString(localeCode, {
                            hour: '2-digit', minute: '2-digit',
                          })} · {match.players.length}/4
                        </p>
                      </div>
                      <Badge
                        variant={match.players.length < 4 ? 'default' : 'secondary'}
                        className={match.players.length < 4 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      >
                        {match.players.length < 4 ? t('openBadge') : t('fullBadge')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Competiciones activas */}
        <div className="club-card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color }} />
              <h2 className="font-display font-bold text-base uppercase tracking-wide">
                {t('competitionsAction')}
              </h2>
            </div>
            <Link href={`${basePath}/competiciones`}>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                {t('viewAll')} <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="p-5">
            {competitions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('noActiveCompetitions')}</p>
            ) : (
              <div className="space-y-2">
                {competitions.map((comp) => (
                  <Link
                    key={comp.id}
                    href={`${basePath}/competiciones/${comp.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border-l-3 hover:bg-muted/70 transition-colors"
                    style={{ borderLeftColor: color }}
                  >
                    <span className="font-medium text-sm">{comp.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {comp.format === 'LEAGUE' ? tComp('league') : comp.format === 'KNOCKOUT' ? tComp('knockout') : tComp('groupAndKnockout')}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Noticias */}
      {news.length > 0 && (
        <div className="club-card overflow-hidden" style={{ borderTop: `3px solid ${color}` }}>
          <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" style={{ color }} />
              <h2 className="font-display font-bold text-base uppercase tracking-wide">
                {t('clubNews')}
              </h2>
            </div>
            <Link href={`${basePath}/noticias`}>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                {t('viewAll')} <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {news.map((item) => (
                <Link
                  key={item.id}
                  href={`${basePath}/noticias/${item.id}`}
                  className="block p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleDateString(localeCode, {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info del club — Seccion oscura premium */}
      <div className="club-section-dark rounded-2xl p-6 sm:p-8">
        <h2 className="font-display font-bold text-lg uppercase tracking-wide mb-6">
          {t('clubInfo')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {club.openingTime && club.closingTime && (
            <div className="flex items-center gap-3 text-sm">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide">{t('schedule')}</p>
                <p className="font-medium">{club.openingTime} - {club.closingTime}</p>
              </div>
            </div>
          )}
          {club.address && (
            <div className="flex items-center gap-3 text-sm">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide">{t('address')}</p>
                <p className="font-medium">{club.address}</p>
              </div>
            </div>
          )}
          {club.phone && (
            <div className="flex items-center gap-3 text-sm">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide">{t('phone')}</p>
                <p className="font-medium">{club.phone}</p>
              </div>
            </div>
          )}
          {club.email && (
            <div className="flex items-center gap-3 text-sm">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide">{t('email')}</p>
                <p className="font-medium">{club.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Redes sociales */}
        {(club.instagramUrl || club.facebookUrl) && (
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
            <span className="text-xs text-white/60 uppercase tracking-wide">{t('followUs')}</span>
            {club.instagramUrl && (
              <a
                href={club.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram del club"
                className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {club.facebookUrl && (
              <a
                href={club.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook del club"
                className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
