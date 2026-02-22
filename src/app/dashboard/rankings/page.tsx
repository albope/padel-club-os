import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Trophy, Flame, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { eloANivel } from '@/lib/elo';

const MEDAL_EMOJI = ['🥇', '🥈', '🥉'];

export default async function AdminRankingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clubId) redirect('/dashboard');

  const rankings = await db.playerStats.findMany({
    where: { clubId: session.user.clubId, matchesPlayed: { gt: 0 } },
    orderBy: { eloRating: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, image: true, level: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Rankings</h1>
        <p className="mt-1 text-muted-foreground">Clasificacion de los jugadores del club (escala 1.0 - 7.0).</p>
        <details className="mt-3">
          <summary className="inline-flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <HelpCircle className="h-4 w-4" />
            ¿Como funciona el sistema de niveles?
          </summary>
          <div className="mt-2 rounded-lg border p-4 text-sm text-muted-foreground space-y-2">
            <p>El ranking se actualiza automaticamente al registrar resultados de competiciones (ligas y torneos).</p>
            <p>Cada jugador tiene un nivel del <strong className="text-foreground">1.0</strong> (principiante) al <strong className="text-foreground">7.0</strong> (profesional). Todos empiezan en <strong className="text-foreground">4.0</strong>. Al ganar, el nivel sube; al perder, baja. La cantidad depende del nivel del rival:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Ganar contra rivales mas fuertes = <strong className="text-green-600 dark:text-green-400">sube mas</strong></li>
              <li>Ganar contra rivales mas debiles = sube poco</li>
              <li>Perder contra rivales mas debiles = <strong className="text-red-500 dark:text-red-400">baja mas</strong></li>
            </ul>
            <p>En dobles, cada jugador se evalua contra el promedio del equipo rival. Los primeros 30 partidos el nivel cambia mas rapido (el sistema esta &quot;ubicando&quot; al jugador).</p>
          </div>
        </details>
      </div>

      {rankings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">No hay rankings aun</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los rankings se generan automaticamente al registrar resultados de competiciones.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Jugador</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Nivel</TableHead>
                <TableHead className="text-right hidden sm:table-cell">PJ</TableHead>
                <TableHead className="text-right hidden sm:table-cell">PG</TableHead>
                <TableHead className="text-right hidden sm:table-cell">%V</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Racha</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Mejor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((r, index) => {
                const posicion = index + 1;
                const winRate = r.matchesPlayed > 0 ? Math.round((r.matchesWon / r.matchesPlayed) * 100) : 0;
                const nivelPadel = eloANivel(r.eloRating);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {posicion <= 3 ? (
                        <span className="text-lg">{MEDAL_EMOJI[posicion - 1]}</span>
                      ) : (
                        posicion
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {r.user.image ? (
                          <img src={r.user.image} alt={r.user.name || ''} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {(r.user.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate max-w-[150px]">{r.user.name || 'Sin nombre'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {r.user.email}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {r.user.level ? (
                        <Badge variant="secondary">{r.user.level}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">{nivelPadel.toFixed(1)}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{r.matchesPlayed}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{r.matchesWon}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{winRate}%</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      {r.winStreak > 0 ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Flame className="h-3 w-3 mr-0.5" />
                          {r.winStreak}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">{r.bestWinStreak}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
