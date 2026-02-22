'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Clock, Loader2, UserPlus, UserMinus, Plus, Filter, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import NuevaPartidaJugadorForm from '@/components/club/NuevaPartidaJugadorForm';

interface OpenMatch {
  id: string;
  matchTime: string;
  status: string;
  levelMin: number | null;
  levelMax: number | null;
  court: { name: string; type: string };
  players: { user: { id: string; name: string; level: string | null; image: string | null } }[];
}

const PARTIDAS_POR_PAGINA = 6;

// Formato YYYY-MM-DD para inputs date
function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ClubOpenMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [matches, setMatches] = useState<OpenMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [maxAdvanceBooking, setMaxAdvanceBooking] = useState<number>(30);

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState<string>('todas');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [filtroPista, setFiltroPista] = useState<string>('todas');
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState<string>('todas');
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');

  // Paginacion
  const [paginaActual, setPaginaActual] = useState(1);

  // Limites de fecha basados en maxAdvanceBooking
  const hoyStr = useMemo(() => formatDateInput(new Date()), []);
  const fechaMaxStr = useMemo(() => {
    const max = new Date();
    max.setDate(max.getDate() + maxAdvanceBooking);
    return formatDateInput(max);
  }, [maxAdvanceBooking]);

  // Fetch datos del club para maxAdvanceBooking
  useEffect(() => {
    const fetchClub = async () => {
      try {
        const res = await fetch(`/api/club/${slug}`);
        if (res.ok) {
          const club = await res.json();
          if (club.maxAdvanceBooking) {
            setMaxAdvanceBooking(club.maxAdvanceBooking);
          }
        }
      } catch { /* silenciar */ }
    };
    fetchClub();
  }, [slug]);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/player/open-matches');
      if (res.ok) {
        setMatches(await res.json());
      }
    } catch { /* silenciar */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchMatches();
    } else {
      setIsLoading(false);
    }
  }, [session, fetchMatches]);

  // Extraer pistas unicas para el filtro
  const pistasUnicas = useMemo(() => {
    const pistas = new Map<string, string>();
    matches.forEach(m => pistas.set(m.court.name, m.court.name));
    return Array.from(pistas.values()).sort();
  }, [matches]);

  // Manejar cambio de filtro fecha
  const handleFiltroFechaChange = (valor: string) => {
    setFiltroFecha(valor);
    if (valor !== 'dia') {
      setFechaSeleccionada('');
    } else if (!fechaSeleccionada) {
      setFechaSeleccionada(hoyStr);
    }
  };

  // Aplicar filtros
  const partidasFiltradas = useMemo(() => {
    let resultado = [...matches];

    // Filtro por fecha
    if (filtroFecha !== 'todas') {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (filtroFecha === 'hoy') {
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        resultado = resultado.filter(m => {
          const fecha = new Date(m.matchTime);
          return fecha >= hoy && fecha < manana;
        });
      } else if (filtroFecha === 'semana') {
        const finSemana = new Date(hoy);
        finSemana.setDate(finSemana.getDate() + 7);
        resultado = resultado.filter(m => {
          const fecha = new Date(m.matchTime);
          return fecha >= hoy && fecha < finSemana;
        });
      } else if (filtroFecha === 'dia' && fechaSeleccionada) {
        const inicio = new Date(fechaSeleccionada + 'T00:00:00');
        const fin = new Date(fechaSeleccionada + 'T23:59:59');
        resultado = resultado.filter(m => {
          const fecha = new Date(m.matchTime);
          return fecha >= inicio && fecha <= fin;
        });
      }
    }

    // Filtro por pista
    if (filtroPista !== 'todas') {
      resultado = resultado.filter(m => m.court.name === filtroPista);
    }

    // Filtro por disponibilidad
    if (filtroDisponibilidad === 'abiertas') {
      resultado = resultado.filter(m => m.players.length < 4);
    } else if (filtroDisponibilidad === 'completas') {
      resultado = resultado.filter(m => m.players.length >= 4);
    } else if (filtroDisponibilidad === 'mis-partidas') {
      resultado = resultado.filter(m =>
        m.players.some(p => p.user.id === session?.user?.id)
      );
    }

    // Filtro por nivel
    if (filtroNivel !== 'todos') {
      const nivelNum = parseFloat(filtroNivel);
      resultado = resultado.filter(m => {
        if (!m.levelMin && !m.levelMax) return true;
        const min = m.levelMin || 0;
        const max = m.levelMax || 10;
        return nivelNum >= min && nivelNum <= max;
      });
    }

    return resultado;
  }, [matches, filtroFecha, fechaSeleccionada, filtroPista, filtroDisponibilidad, filtroNivel, session?.user?.id]);

  // Paginacion
  const totalPaginas = Math.max(1, Math.ceil(partidasFiltradas.length / PARTIDAS_POR_PAGINA));
  const partidasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * PARTIDAS_POR_PAGINA;
    return partidasFiltradas.slice(inicio, inicio + PARTIDAS_POR_PAGINA);
  }, [partidasFiltradas, paginaActual]);

  // Resetear pagina al cambiar filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroFecha, fechaSeleccionada, filtroPista, filtroDisponibilidad, filtroNivel]);

  const hayFiltrosActivos = filtroFecha !== 'todas' || filtroPista !== 'todas' || filtroDisponibilidad !== 'todas' || filtroNivel !== 'todos';

  const limpiarFiltros = () => {
    setFiltroFecha('todas');
    setFechaSeleccionada('');
    setFiltroPista('todas');
    setFiltroDisponibilidad('todas');
    setFiltroNivel('todos');
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Partidas abiertas</h1>
          <p className="text-muted-foreground">Encuentra jugadores y unete a una partida</p>
        </div>
        {session?.user && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear partida
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
            {hayFiltrosActivos && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={limpiarFiltros}>
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Select value={filtroFecha} onValueChange={handleFiltroFechaChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las fechas</SelectItem>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="dia">Dia concreto</SelectItem>
                </SelectContent>
              </Select>
              {filtroFecha === 'dia' && (
                <div className="relative">
                  <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    min={hoyStr}
                    max={fechaMaxStr}
                    className="h-9 text-sm pl-8"
                  />
                </div>
              )}
            </div>

            <Select value={filtroPista} onValueChange={setFiltroPista}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Pista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las pistas</SelectItem>
                {pistasUnicas.map(pista => (
                  <SelectItem key={pista} value={pista}>{pista}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroDisponibilidad} onValueChange={setFiltroDisponibilidad}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Disponibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="abiertas">Abiertas (con huecos)</SelectItem>
                <SelectItem value="completas">Pista completa</SelectItem>
                <SelectItem value="mis-partidas">Mis partidas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroNivel} onValueChange={setFiltroNivel}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                <SelectItem value="1">Nivel 1</SelectItem>
                <SelectItem value="2">Nivel 2</SelectItem>
                <SelectItem value="3">Nivel 3</SelectItem>
                <SelectItem value="4">Nivel 4</SelectItem>
                <SelectItem value="5">Nivel 5</SelectItem>
                <SelectItem value="6">Nivel 6</SelectItem>
                <SelectItem value="7">Nivel 7</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filtroFecha === 'dia' && fechaSeleccionada && (
            <p className="text-xs text-muted-foreground mt-2">
              Maximo {maxAdvanceBooking} dias de antelacion
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear partida */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear partida abierta</DialogTitle>
          </DialogHeader>
          <NuevaPartidaJugadorForm
            slug={slug}
            onExito={() => {
              setShowCreateDialog(false);
              fetchMatches();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Contador de resultados */}
      {matches.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {partidasFiltradas.length === matches.length
              ? `${matches.length} partida${matches.length !== 1 ? 's' : ''}`
              : `${partidasFiltradas.length} de ${matches.length} partidas`
            }
          </span>
          {totalPaginas > 1 && (
            <span>Pagina {paginaActual} de {totalPaginas}</span>
          )}
        </div>
      )}

      {/* Lista de partidas */}
      {partidasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">
              {matches.length === 0 ? 'No hay partidas abiertas' : 'No hay partidas con estos filtros'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {matches.length === 0
                ? 'Vuelve mas tarde para ver nuevas partidas.'
                : 'Prueba a cambiar los filtros o limpia la busqueda.'
              }
            </p>
            {hayFiltrosActivos && (
              <Button variant="outline" size="sm" className="mt-4" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {partidasPaginadas.map((match) => {
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
                          {isFull && (
                            <Badge variant="destructive" className="text-xs">Completa</Badge>
                          )}
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

          {/* Paginacion */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
                  <Button
                    key={pagina}
                    variant={pagina === paginaActual ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPaginaActual(pagina)}
                  >
                    {pagina}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
