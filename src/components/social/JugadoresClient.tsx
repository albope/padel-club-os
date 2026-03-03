'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Users2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlayerCard } from './PlayerCard';
import { useTranslations } from 'next-intl';

interface PublicPlayer {
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
}

interface JugadoresClientProps {
  initialJugadores: PublicPlayer[];
  initialTotal: number;
  slug: string;
}

const NIVELES = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7'];
const POSICIONES = ['Derecha', 'Reves', 'Ambas'];
const POR_PAGINA = 12;

export default function JugadoresClient({ initialJugadores, initialTotal, slug }: JugadoresClientProps) {
  const t = useTranslations('social');
  const tc = useTranslations('common');

  const [jugadores, setJugadores] = useState<PublicPlayer[]>(initialJugadores);
  const [total, setTotal] = useState(initialTotal);
  const [busqueda, setBusqueda] = useState('');
  const [nivel, setNivel] = useState('todos');
  const [posicion, setPosicion] = useState('todas');
  const [pagina, setPagina] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const fetchJugadores = useCallback(async (q: string, niv: string, pos: string, pag: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (niv !== 'todos') params.set('nivel', niv);
      if (pos !== 'todas') params.set('posicion', pos);
      params.set('page', String(pag));
      params.set('limit', String(POR_PAGINA));

      const res = await fetch(`/api/club/${slug}/players?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJugadores(data.jugadores);
        setTotal(data.total);
      }
    } catch { /* silenciar */ }
    finally { setIsLoading(false); }
  }, [slug]);

  // Debounce busqueda texto
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPagina(1);
      fetchJugadores(busqueda, nivel, posicion, 1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busqueda, fetchJugadores, nivel, posicion]);

  // Cambio de filtros (sin debounce)
  const handleNivelChange = (v: string) => {
    setNivel(v);
    setPagina(1);
  };

  const handlePosicionChange = (v: string) => {
    setPosicion(v);
    setPagina(1);
  };

  const handlePaginaChange = (nuevaPagina: number) => {
    setPagina(nuevaPagina);
    fetchJugadores(busqueda, nivel, posicion, nuevaPagina);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('searchPlayers')}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
            aria-label={t('searchPlayers')}
          />
        </div>
        <Select value={nivel} onValueChange={handleNivelChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('filterLevel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{t('allLevels')}</SelectItem>
            {NIVELES.map((n) => (
              <SelectItem key={n} value={n}>{t('level')} {n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={posicion} onValueChange={handlePosicionChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('filterPosition')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">{t('allPositions')}</SelectItem>
            {POSICIONES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contador */}
      <p className="text-sm text-muted-foreground">
        {total} {t('players').toLowerCase()}
        {totalPaginas > 1 && ` · ${tc('pageOf', { current: pagina, total: totalPaginas })}`}
      </p>

      {/* Grid de jugadores */}
      {jugadores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium">{t('noPlayersYet')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('noPlayersYetDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${isLoading ? 'opacity-60' : ''}`}>
          {jugadores.map((j) => (
            <PlayerCard key={j.id} jugador={j} slug={slug} />
          ))}
        </div>
      )}

      {/* Paginacion */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePaginaChange(Math.max(1, pagina - 1))}
            disabled={pagina === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {tc('previous')}
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              let pageNum: number;
              if (totalPaginas <= 5) {
                pageNum = i + 1;
              } else if (pagina <= 3) {
                pageNum = i + 1;
              } else if (pagina >= totalPaginas - 2) {
                pageNum = totalPaginas - 4 + i;
              } else {
                pageNum = pagina - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagina ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handlePaginaChange(pageNum)}
                  disabled={isLoading}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePaginaChange(Math.min(totalPaginas, pagina + 1))}
            disabled={pagina === totalPaginas || isLoading}
          >
            {tc('next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
