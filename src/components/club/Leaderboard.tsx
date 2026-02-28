'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Trophy, Flame, TrendingUp, Target, Swords, Award, HelpCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface RankingEntry {
  posicion: number;
  userId: string;
  nombre: string;
  imagen: string | null;
  nivel: string | null;
  nivelPadel: number;
  partidosJugados: number;
  partidosGanados: number;
  porcentajeVictorias: number;
  setsGanados: number;
  setsPerdidos: number;
  juegosGanados: number;
  juegosPerdidos: number;
  rachaActual: number;
  mejorRacha: number;
}

interface PlayerStatsResponse {
  stats: {
    nivelPadel: number;
    matchesPlayed: number;
    matchesWon: number;
    setsWon: number;
    setsLost: number;
    gamesWon: number;
    gamesLost: number;
    winStreak: number;
    bestWinStreak: number;
  };
  posicion: number | null;
  totalJugadores: number;
}

interface LeaderboardProps {
  rankings: RankingEntry[];
}

const MEDAL_COLORS = [
  { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700', emoji: '🥇' },
  { bg: 'bg-gray-100 dark:bg-gray-800/50', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600', emoji: '🥈' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700', emoji: '🥉' },
];

function AvatarInicial({ nombre, imagen, size = 'sm' }: { nombre: string; imagen: string | null; size?: 'sm' | 'lg' }) {
  const dimensiones = size === 'lg' ? 'h-12 w-12 text-lg' : 'h-8 w-8 text-xs';
  const sizePixels = size === 'lg' ? 48 : 32;
  if (imagen) {
    return <Image src={imagen} alt={nombre} width={sizePixels} height={sizePixels} className={cn(dimensiones, 'rounded-full object-cover')} />;
  }
  return (
    <div className={cn(dimensiones, 'rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold')}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}

function StatCard({ titulo, valor, subtitulo, icono: Icono }: {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icono: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Icono className="h-4 w-4" />
          <span className="text-xs font-medium">{titulo}</span>
        </div>
        <p className="text-2xl font-bold">{valor}</p>
        {subtitulo && <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p>}
      </CardContent>
    </Card>
  );
}

export default function Leaderboard({ rankings }: LeaderboardProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [myStats, setMyStats] = useState<PlayerStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState('ranking');

  useEffect(() => {
    if (activeTab === 'estadisticas' && !myStats && currentUserId) {
      setLoadingStats(true);
      fetch('/api/player/stats')
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setMyStats(data); })
        .catch(() => {})
        .finally(() => setLoadingStats(false));
    }
  }, [activeTab, myStats, currentUserId]);

  if (rankings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="font-medium text-foreground">No hay rankings aún</p>
          <p className="text-sm text-muted-foreground mt-1">
            Se generan automáticamente al registrar resultados de competiciones.
          </p>
        </CardContent>
      </Card>
    );
  }

  const top3 = rankings.slice(0, 3);
  const todosRankings = rankings;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="ranking">Ranking</TabsTrigger>
        {currentUserId && <TabsTrigger value="estadisticas">Mis estadísticas</TabsTrigger>}
        <TabsTrigger value="info" className="gap-1">
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Cómo funciona</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ranking" className="space-y-6 mt-4">
        {/* Podio top 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3.map((jugador, i) => (
            <Card
              key={jugador.userId}
              className={cn(
                'border-2',
                MEDAL_COLORS[i].border,
                currentUserId === jugador.userId && 'ring-2 ring-primary'
              )}
            >
              <CardContent className="flex flex-col items-center py-4 px-3">
                <span className="text-2xl mb-1">{MEDAL_COLORS[i].emoji}</span>
                <AvatarInicial nombre={jugador.nombre} imagen={jugador.imagen} size="lg" />
                <p className="font-semibold mt-2 text-center truncate w-full">{jugador.nombre}</p>
                {jugador.nivel && (
                  <Badge variant="secondary" className="mt-1 text-xs">{jugador.nivel}</Badge>
                )}
                <p className={cn('text-2xl font-bold mt-2', MEDAL_COLORS[i].text)}>
                  {(jugador.nivelPadel ?? 4.0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {jugador.partidosGanados}V / {jugador.partidosJugados - jugador.partidosGanados}D ({jugador.porcentajeVictorias}%)
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabla completa */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Jugador</TableHead>
                <TableHead className="text-right">Nivel</TableHead>
                <TableHead className="text-right hidden sm:table-cell">PJ</TableHead>
                <TableHead className="text-right hidden sm:table-cell">%V</TableHead>
                <TableHead className="text-right">Racha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todosRankings.map((jugador) => {
                const esUsuarioActual = currentUserId === jugador.userId;
                return (
                  <TableRow
                    key={jugador.userId}
                    className={cn(esUsuarioActual && 'bg-primary/5 font-medium')}
                  >
                    <TableCell className="font-medium">
                      {jugador.posicion <= 3 ? (
                        <span className="text-lg">{MEDAL_COLORS[jugador.posicion - 1].emoji}</span>
                      ) : (
                        jugador.posicion
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AvatarInicial nombre={jugador.nombre} imagen={jugador.imagen} />
                        <div className="min-w-0">
                          <p className="truncate">{jugador.nombre}</p>
                          {jugador.nivel && (
                            <p className="text-xs text-muted-foreground">{jugador.nivel}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{(jugador.nivelPadel ?? 4.0).toFixed(1)}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{jugador.partidosJugados}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{jugador.porcentajeVictorias}%</TableCell>
                    <TableCell className="text-right">
                      {jugador.rachaActual > 0 ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Flame className="h-3 w-3 mr-0.5" />
                          {jugador.rachaActual}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      {currentUserId && (
        <TabsContent value="estadisticas" className="mt-4">
          {loadingStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : myStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                titulo="Nivel"
                valor={(myStats.stats.nivelPadel ?? 4.0).toFixed(1)}
                subtitulo="escala 1.0 - 7.0"
                icono={TrendingUp}
              />
              <StatCard
                titulo="Posición"
                valor={myStats.posicion ? `#${myStats.posicion}` : '-'}
                subtitulo={myStats.totalJugadores > 0 ? `de ${myStats.totalJugadores} jugadores` : undefined}
                icono={Award}
              />
              <StatCard
                titulo="Partidos"
                valor={`${myStats.stats.matchesWon} / ${myStats.stats.matchesPlayed}`}
                subtitulo="ganados / jugados"
                icono={Target}
              />
              <StatCard
                titulo="% Victorias"
                valor={myStats.stats.matchesPlayed > 0 ? `${Math.round((myStats.stats.matchesWon / myStats.stats.matchesPlayed) * 100)}%` : '-'}
                icono={Trophy}
              />
              <StatCard
                titulo="Sets"
                valor={`${myStats.stats.setsWon} / ${myStats.stats.setsLost}`}
                subtitulo="ganados / perdidos"
                icono={Swords}
              />
              <StatCard
                titulo="Juegos"
                valor={`${myStats.stats.gamesWon} / ${myStats.stats.gamesLost}`}
                subtitulo="ganados / perdidos"
                icono={Swords}
              />
              <StatCard
                titulo="Racha actual"
                valor={myStats.stats.winStreak}
                subtitulo="victorias seguidas"
                icono={Flame}
              />
              <StatCard
                titulo="Mejor racha"
                valor={myStats.stats.bestWinStreak}
                subtitulo="victorias seguidas"
                icono={Award}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-medium text-foreground">Sin clasificar</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Participa en competiciones para aparecer en el ranking.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      )}
      <TabsContent value="info" className="mt-4">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">¿Qué es el nivel de pádel?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Cada jugador tiene un nivel del <strong>1.0</strong> (principiante) al <strong>7.0</strong> (profesional),
                  similar a la escala de Playtomic. Se calcula automáticamente con un sistema matemático (ELO)
                  basado en tus resultados de competiciones.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">Escala de niveles</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="font-bold">1.0 - 2.0</p>
                    <p className="text-xs text-muted-foreground">Principiante</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="font-bold">2.5 - 3.5</p>
                    <p className="text-xs text-muted-foreground">Intermedio</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="font-bold">4.0 - 5.0</p>
                    <p className="text-xs text-muted-foreground">Avanzado</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="font-bold">5.5 - 7.0</p>
                    <p className="text-xs text-muted-foreground">Experto / Pro</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Todos los jugadores empiezan en <strong>4.0</strong> (nivel inicial). Tu nivel se ajusta según tus resultados.</p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">¿Cómo sube o baja mi nivel?</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <ArrowUp className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                    <span>Al <strong>ganar</strong> un partido de competición, tu nivel sube</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowDown className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                    <span>Al <strong>perder</strong>, tu nivel baja</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">La clave: importa contra quién ganas o pierdes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-3">
                    <p className="font-medium text-green-700 dark:text-green-400">Subes mucho si...</p>
                    <p className="text-muted-foreground mt-1">Vences a una pareja con nivel <strong>mayor</strong> que el tuyo</p>
                  </div>
                  <div className="rounded-md bg-orange-50 dark:bg-orange-950/30 p-3">
                    <p className="font-medium text-orange-700 dark:text-orange-400">Subes poco si...</p>
                    <p className="text-muted-foreground mt-1">Vences a una pareja con nivel <strong>menor</strong> que el tuyo</p>
                  </div>
                  <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3">
                    <p className="font-medium text-red-700 dark:text-red-400">Bajas mucho si...</p>
                    <p className="text-muted-foreground mt-1">Pierdes contra una pareja con nivel <strong>menor</strong> que el tuyo</p>
                  </div>
                  <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-3">
                    <p className="font-medium text-blue-700 dark:text-blue-400">Bajas poco si...</p>
                    <p className="text-muted-foreground mt-1">Pierdes contra una pareja con nivel <strong>mayor</strong> que el tuyo</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">En pádel (dobles)</h4>
                <p className="text-sm text-muted-foreground">
                  En cada partido se compara tu nivel individual contra el <strong>promedio del equipo rival</strong>.
                  Así, aunque juegues con diferentes compañeros, tu nivel refleja tu habilidad real.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">Estabilidad del nivel</h4>
                <p className="text-sm text-muted-foreground">
                  Los primeros 30 partidos tu nivel cambia más rápidamente (el sistema te está &quot;ubicando&quot;).
                  Después de 100+ partidos, los cambios son más pequeños y tu nivel es más estable y fiable.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
