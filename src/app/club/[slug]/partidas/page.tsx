'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Clock, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface OpenMatch {
  id: string;
  matchTime: string;
  status: string;
  levelMin: number | null;
  levelMax: number | null;
  court: { name: string; type: string };
  players: { user: { id: string; name: string; level: string | null; image: string | null } }[];
}

export default function ClubOpenMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [matches, setMatches] = useState<OpenMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/player/open-matches');
      if (res.ok) {
        setMatches(await res.json());
      }
    } catch { /* silenciar */ }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (session?.user) {
      fetchMatches();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const handleJoin = async (openMatchId: string) => {
    if (!session?.user) {
      router.push(`/club/${slug}/login`);
      return;
    }

    setActionLoading(openMatchId);
    try {
      const res = await fetch('/api/player/open-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openMatchId }),
      });

      if (res.ok) {
        toast({ title: "Te has unido", description: "Estas en la partida." });
        fetchMatches();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexion.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (openMatchId: string) => {
    setActionLoading(openMatchId);
    try {
      const res = await fetch(`/api/player/open-matches?openMatchId=${openMatchId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({ title: "Has salido", description: "Has abandonado la partida." });
        fetchMatches();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexion.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Partidas abiertas</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">Inicia sesion para ver las partidas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Necesitas una cuenta para unirte a partidas abiertas.
            </p>
            <Button className="mt-4" onClick={() => router.push(`/club/${slug}/login`)}>
              Iniciar sesion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Partidas abiertas</h1>
        <p className="text-muted-foreground">Encuentra jugadores y unete a una partida</p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">No hay partidas abiertas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vuelve mas tarde para ver nuevas partidas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => {
            const isInMatch = match.players.some(p => p.user.id === session.user.id);
            const isFull = match.players.length >= 4;
            const isLoadingThis = actionLoading === match.id;

            return (
              <Card key={match.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{match.court.name}</Badge>
                        <span className="text-sm font-medium">
                          {new Date(match.matchTime).toLocaleDateString('es-ES', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(match.matchTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Nivel */}
                      {(match.levelMin || match.levelMax) && (
                        <p className="text-xs text-muted-foreground">
                          Nivel: {match.levelMin || '?'} - {match.levelMax || '?'}
                        </p>
                      )}

                      {/* Jugadores */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {match.players.map((p, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {p.user.name || 'Jugador'}
                            {p.user.level && ` (${p.user.level})`}
                          </Badge>
                        ))}
                        {Array.from({ length: 4 - match.players.length }).map((_, i) => (
                          <Badge key={`empty-${i}`} variant="outline" className="text-xs text-muted-foreground border-dashed">
                            Libre
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Accion */}
                    <div className="shrink-0">
                      {isInMatch ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeave(match.id)}
                          disabled={isLoadingThis}
                        >
                          {isLoadingThis ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><UserMinus className="h-4 w-4 mr-1" /> Salir</>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleJoin(match.id)}
                          disabled={isFull || isLoadingThis}
                        >
                          {isLoadingThis ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isFull ? (
                            'Completa'
                          ) : (
                            <><UserPlus className="h-4 w-4 mr-1" /> Unirme</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
