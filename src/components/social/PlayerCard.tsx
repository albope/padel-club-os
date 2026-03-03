'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EstrellasDisplay } from './EstrellasDisplay';
import { useTranslations } from 'next-intl';

interface PlayerCardProps {
  jugador: {
    id: string;
    nombre: string;
    imagen: string | null;
    nivel: string | null;
    posicion: string | null;
    nivelPadel: number | null;
    partidosJugados: number;
    porcentajeVictorias: number;
    mediaEstrellas: number | null;
    totalValoraciones: number;
  };
  slug: string;
}

export function PlayerCard({ jugador, slug }: PlayerCardProps) {
  const t = useTranslations('social');

  return (
    <Link href={`/club/${slug}/jugadores/${jugador.id}`}>
      <Card className="transition-colors hover:border-primary/30 hover:bg-muted/30 cursor-pointer h-full">
        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
          {/* Avatar */}
          {jugador.imagen ? (
            <Image
              src={jugador.imagen}
              alt={jugador.nombre}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
              {jugador.nombre.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Nombre */}
          <p className="font-semibold truncate w-full">{jugador.nombre}</p>

          {/* Badges: nivel ELO + nivel auto-declarado */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {jugador.nivelPadel !== null && (
              <Badge variant="default" className="text-xs">
                ELO {jugador.nivelPadel.toFixed(1)}
              </Badge>
            )}
            {jugador.nivel && (
              <Badge variant="secondary" className="text-xs">
                {jugador.nivel}
              </Badge>
            )}
          </div>

          {/* Posicion */}
          {jugador.posicion && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {jugador.posicion}
            </p>
          )}

          {/* Stats compactos */}
          <p className="text-xs text-muted-foreground">
            {jugador.partidosJugados} {t('matches')} · {jugador.porcentajeVictorias}% {t('winRate')}
          </p>

          {/* Estrellas */}
          {jugador.mediaEstrellas !== null && (
            <EstrellasDisplay
              valor={jugador.mediaEstrellas}
              total={jugador.totalValoraciones}
              size="sm"
            />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
