'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CalendarDays, Users, Trophy, Clock, MapPin, Phone, Mail,
  Newspaper, ChevronRight, Instagram, Facebook,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const basePath = `/club/${params.slug}`;
  const color = club.primaryColor || '#4f46e5';

  return (
    <div className="space-y-6">
      {/* Hero */}
      {club.bannerUrl ? (
        <div
          className="relative rounded-xl overflow-hidden h-48 sm:h-64 flex items-end"
          style={{
            backgroundImage: `url(${club.bannerUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative z-10 p-6">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {club.name}
            </h1>
            {club.description && (
              <p className="text-white/80 max-w-2xl mt-1 text-sm">
                {club.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {club.name}
          </h1>
          {club.description && (
            <p className="text-muted-foreground max-w-2xl">{club.description}</p>
          )}
        </div>
      )}

      {/* Acciones rapidas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {club.enablePlayerBooking && (
          <Link href={`${basePath}/reservar`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Reservar pista
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Encuentra tu horario ideal
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {club.enableOpenMatches && (
          <Link href={`${basePath}/partidas`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Partidas abiertas
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Unete a una partida
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href={`${basePath}/competiciones`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-6">
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: color }}
              >
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Competiciones
                </p>
                <p className="text-sm text-muted-foreground">
                  Ligas y torneos activos
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Proximas partidas abiertas */}
        {club.enableOpenMatches && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Proximas partidas</CardTitle>
              <Link href={`${basePath}/partidas`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  Ver todas <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {openMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay partidas abiertas proximas.</p>
              ) : (
                <div className="space-y-3">
                  {openMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{match.court.name}</Badge>
                          <span className="text-sm font-medium">
                            {new Date(match.matchTime).toLocaleDateString('es-ES', {
                              weekday: 'short', day: 'numeric', month: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(match.matchTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit', minute: '2-digit',
                          })} · {match.players.length}/4 jugadores
                        </p>
                      </div>
                      <Badge variant={match.players.length < 4 ? 'default' : 'secondary'}>
                        {match.players.length < 4 ? 'Abierta' : 'Completa'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Competiciones activas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Competiciones activas</CardTitle>
            <Link href={`${basePath}/competiciones`}>
              <Button variant="ghost" size="sm" className="text-xs">
                Ver todas <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {competitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay competiciones activas.</p>
            ) : (
              <div className="space-y-2">
                {competitions.map((comp) => (
                  <Link
                    key={comp.id}
                    href={`${basePath}/competiciones/${comp.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-sm">{comp.name}</span>
                    <Badge variant="outline">
                      {comp.format === 'LEAGUE' ? 'Liga' : comp.format === 'KNOCKOUT' ? 'Torneo' : 'Grupos'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Noticias */}
      {news.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Noticias del club
            </CardTitle>
            <Link href={`${basePath}/noticias`}>
              <Button variant="ghost" size="sm" className="text-xs">
                Ver todas <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {news.map((item) => (
                <Link
                  key={item.id}
                  href={`${basePath}/noticias/${item.id}`}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(item.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info del club */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informacion del club</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {club.openingTime && club.closingTime && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Horario: {club.openingTime} - {club.closingTime}</span>
              </div>
            )}
            {club.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{club.address}</span>
              </div>
            )}
            {club.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{club.phone}</span>
              </div>
            )}
            {club.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{club.email}</span>
              </div>
            )}
            {club.instagramUrl && (
              <a
                href={club.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm hover:text-foreground text-muted-foreground transition-colors"
              >
                <Instagram className="h-4 w-4 shrink-0" />
                <span>Instagram</span>
              </a>
            )}
            {club.facebookUrl && (
              <a
                href={club.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm hover:text-foreground text-muted-foreground transition-colors"
              >
                <Facebook className="h-4 w-4 shrink-0" />
                <span>Facebook</span>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
