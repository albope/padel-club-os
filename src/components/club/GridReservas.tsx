'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import ConfirmacionReserva from './ConfirmacionReserva';

interface Pista {
  id: string;
  name: string;
  type: string;
}

interface Bloque {
  courtId: string;
  tipo: 'reserva' | 'partida-abierta';
  inicio: string;
  fin: string;
  userId?: string | null;
  plazasLibres?: number;
  nivelMin?: number | null;
  nivelMax?: number | null;
  openMatchId?: string;
  jugadores?: string[];
}

interface GridReservasProps {
  club: {
    slug: string;
    primaryColor: string | null;
    openingTime: string | null;
    closingTime: string | null;
    bookingDuration: number | null;
  };
  pistas: Pista[];
  sesionUserId: string | null;
  slug: string;
}

// Genera franjas de 30 minutos entre apertura y cierre
function generarFranjas(openingTime: string, closingTime: string): string[] {
  const franjas: string[] = [];
  const [startH, startM] = openingTime.split(':').map(Number);
  const [endH, endM] = closingTime.split(':').map(Number);
  const startMinutos = startH * 60 + (startM || 0);
  const endMinutos = endH * 60 + (endM || 0);

  for (let m = startMinutos; m < endMinutos; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    franjas.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return franjas;
}

// Convierte "HH:MM" a minutos desde medianoche
function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Indice de fila en el grid para una hora dada
function indiceFila(hora: string, aperturaMinutos: number): number {
  return Math.floor((horaAMinutos(hora) - aperturaMinutos) / 30);
}

export default function GridReservas({ club, pistas, sesionUserId, slug }: GridReservasProps) {
  const router = useRouter();
  const openingTime = club.openingTime || '09:00';
  const closingTime = club.closingTime || '23:00';
  const duracion = club.bookingDuration || 90;
  const aperturaMinutos = horaAMinutos(openingTime);

  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [precios, setPrecios] = useState<Record<string, Record<number, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState<{
    pista: Pista;
    horaInicio: string;
    precio: number | null;
  } | null>(null);

  const hoy = useMemo(() => new Date().toISOString().split('T')[0], []);
  const franjas = useMemo(() => generarFranjas(openingTime, closingTime), [openingTime, closingTime]);
  const totalFilas = franjas.length;

  // Cargar disponibilidad y precios cuando cambia la fecha
  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch disponibilidad
      const availRes = await fetch(`/api/club/${slug}/availability?date=${fecha}`);
      if (availRes.ok) {
        const data = await availRes.json();
        setBloques(data.bloques || []);
      } else {
        setBloques([]);
      }

      // Fetch precios de todas las pistas en paralelo
      const preciosPorPista: Record<string, Record<number, number>> = {};
      const precioPromises = pistas.map(async (pista) => {
        const res = await fetch(`/api/club/${slug}/pricing?courtId=${pista.id}&date=${fecha}`);
        if (res.ok) {
          const data = await res.json();
          const priceMap: Record<number, number> = {};
          for (const p of data) {
            for (let h = p.startHour; h < p.endHour; h++) {
              priceMap[h] = p.price;
            }
          }
          preciosPorPista[pista.id] = priceMap;
        }
      });
      await Promise.all(precioPromises);
      setPrecios(preciosPorPista);
    } catch {
      setBloques([]);
    } finally {
      setIsLoading(false);
    }
  }, [fecha, slug, pistas]);

  useEffect(() => {
    if (pistas.length > 0) {
      cargarDatos();
    }
  }, [cargarDatos, pistas.length]);

  // Mapa de celdas ocupadas: `courtId-filaIdx` -> bloque
  const celdasOcupadas = useMemo(() => {
    const mapa = new Map<string, Bloque>();
    for (const bloque of bloques) {
      const inicio = new Date(bloque.inicio);
      const fin = new Date(bloque.fin);
      const horaInicioStr = `${String(inicio.getHours()).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}`;
      const horaFinStr = `${String(fin.getHours()).padStart(2, '0')}:${String(fin.getMinutes()).padStart(2, '0')}`;

      const filaInicio = indiceFila(horaInicioStr, aperturaMinutos);
      const filaFin = indiceFila(horaFinStr, aperturaMinutos);

      for (let f = filaInicio; f < filaFin; f++) {
        mapa.set(`${bloque.courtId}-${f}`, bloque);
      }
    }
    return mapa;
  }, [bloques, aperturaMinutos]);

  // Detectar si un bloque empieza en esta fila (para renderizar el bloque visual)
  const bloquesIniciales = useMemo(() => {
    const mapa = new Map<string, { bloque: Bloque; filas: number }>();
    for (const bloque of bloques) {
      const inicio = new Date(bloque.inicio);
      const fin = new Date(bloque.fin);
      const horaInicioStr = `${String(inicio.getHours()).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}`;
      const horaFinStr = `${String(fin.getHours()).padStart(2, '0')}:${String(fin.getMinutes()).padStart(2, '0')}`;

      const filaInicio = indiceFila(horaInicioStr, aperturaMinutos);
      const filaFin = indiceFila(horaFinStr, aperturaMinutos);
      const filas = filaFin - filaInicio;

      mapa.set(`${bloque.courtId}-${filaInicio}`, { bloque, filas });
    }
    return mapa;
  }, [bloques, aperturaMinutos]);

  const moverFecha = (dias: number) => {
    const d = new Date(`${fecha}T12:00:00`);
    d.setDate(d.getDate() + dias);
    setFecha(d.toISOString().split('T')[0]);
  };

  const esPropia = (bloque: Bloque): boolean => {
    if (!sesionUserId) return false;
    if (bloque.tipo === 'reserva') return bloque.userId === sesionUserId;
    if (bloque.tipo === 'partida-abierta') {
      return bloque.jugadores?.includes(sesionUserId) || false;
    }
    return false;
  };

  // Verificar que un slot esta libre para la duracion completa
  const slotLibre = (pistaId: string, filaIdx: number): boolean => {
    const filasNecesarias = Math.ceil(duracion / 30);
    for (let f = filaIdx; f < filaIdx + filasNecesarias; f++) {
      if (f >= totalFilas) return false;
      if (celdasOcupadas.has(`${pistaId}-${f}`)) return false;
    }
    return true;
  };

  const handleClickSlot = (pista: Pista, franja: string, filaIdx: number) => {
    if (!slotLibre(pista.id, filaIdx)) return;

    const hora = parseInt(franja.split(':')[0]);
    const precioPista = precios[pista.id]?.[hora] ?? null;

    setSlotSeleccionado({
      pista,
      horaInicio: franja,
      precio: precioPista,
    });
    setSheetOpen(true);
  };

  const handlePartidaAbierta = (openMatchId: string) => {
    router.push(`/club/${slug}/partidas`);
  };

  const fechaFormateada = new Date(`${fecha}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Navegacion de fecha */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-3">
        <Button variant="ghost" size="icon" onClick={() => moverFecha(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 text-center">
          <span className="font-semibold capitalize text-sm sm:text-base">
            {fechaFormateada}
          </span>
          {fecha !== hoy && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => setFecha(hoy)}
            >
              Hoy
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => moverFecha(1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Leyenda */}
      <div className="flex gap-3 sm:gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-background border border-border" />
          <span className="text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" />
          <span className="text-muted-foreground">Ocupado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-200" />
          <span className="text-muted-foreground">Tu reserva</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-200" />
          <span className="text-muted-foreground">Partida abierta</span>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="space-y-1">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : pistas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay pistas configuradas en este club.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `60px repeat(${pistas.length}, minmax(100px, 1fr))`,
              gridTemplateRows: `auto repeat(${totalFilas}, 2rem)`,
              minWidth: `${60 + pistas.length * 100}px`,
            }}
          >
            {/* Header: celda vacia + nombres de pistas */}
            <div className="sticky left-0 z-20 bg-muted border-b border-r p-2 text-xs font-medium text-muted-foreground flex items-center justify-center">
              Hora
            </div>
            {pistas.map((pista, colIdx) => (
              <div
                key={pista.id}
                className="bg-muted border-b border-r p-2 text-center"
              >
                <p className="text-xs font-semibold truncate">{pista.name}</p>
                <p className="text-[10px] text-muted-foreground">{pista.type}</p>
              </div>
            ))}

            {/* Filas de horas + celdas por pista */}
            {franjas.map((franja, filaIdx) => {
              const esHoraEnPunto = franja.endsWith(':00');
              return (
                <React.Fragment key={franja}>
                  {/* Columna de hora */}
                  <div
                    className={cn(
                      'sticky left-0 z-10 bg-background border-r px-1 flex items-center justify-center text-[11px] text-muted-foreground',
                      esHoraEnPunto && 'border-t border-border/50'
                    )}
                    style={{
                      gridRow: filaIdx + 2,
                      gridColumn: 1,
                    }}
                  >
                    {esHoraEnPunto ? franja : ''}
                  </div>

                  {/* Celdas de pistas */}
                  {pistas.map((pista, colIdx) => {
                    const celdaKey = `${pista.id}-${filaIdx}`;
                    const bloqueInicial = bloquesIniciales.get(celdaKey);
                    const estaOcupada = celdasOcupadas.has(celdaKey);

                    // Si hay un bloque que empieza aqui, renderizar el bloque
                    if (bloqueInicial) {
                      const { bloque, filas } = bloqueInicial;
                      const propia = esPropia(bloque);
                      const esPartida = bloque.tipo === 'partida-abierta';
                      const inicio = new Date(bloque.inicio);
                      const fin = new Date(bloque.fin);
                      const horaInicioStr = `${String(inicio.getHours()).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}`;
                      const horaFinStr = `${String(fin.getHours()).padStart(2, '0')}:${String(fin.getMinutes()).padStart(2, '0')}`;

                      return (
                        <div
                          key={celdaKey}
                          style={{
                            gridRow: `${filaIdx + 2} / span ${filas}`,
                            gridColumn: colIdx + 2,
                          }}
                          className={cn(
                            'mx-0.5 my-px rounded-sm flex flex-col items-center justify-center text-[10px] font-medium overflow-hidden select-none',
                            esPartida && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50',
                            !esPartida && propia && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
                            !esPartida && !propia && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
                          )}
                          onClick={esPartida ? () => handlePartidaAbierta(bloque.openMatchId!) : undefined}
                        >
                          <span className="font-semibold leading-tight">
                            {horaInicioStr}-{horaFinStr}
                          </span>
                          {esPartida && (
                            <>
                              <span className="flex items-center gap-0.5 leading-tight">
                                <Users className="h-2.5 w-2.5" />
                                {bloque.plazasLibres} libres
                              </span>
                              {bloque.nivelMin != null && (
                                <span className="opacity-75 leading-tight">
                                  Nivel {bloque.nivelMin}-{bloque.nivelMax}
                                </span>
                              )}
                            </>
                          )}
                          {!esPartida && propia && (
                            <span className="leading-tight">Tu reserva</span>
                          )}
                        </div>
                      );
                    }

                    // Si la celda esta ocupada por un bloque que empezo antes, no renderizar nada
                    if (estaOcupada) return null;

                    // Celda libre
                    const precio = precios[pista.id]?.[parseInt(franja.split(':')[0])];
                    const puedeReservar = slotLibre(pista.id, filaIdx);

                    return (
                      <div
                        key={celdaKey}
                        style={{
                          gridRow: filaIdx + 2,
                          gridColumn: colIdx + 2,
                        }}
                        className={cn(
                          'border-r border-b border-border/20 transition-colors',
                          esHoraEnPunto && 'border-t border-t-border/40',
                          puedeReservar && 'cursor-pointer hover:bg-primary/5 active:bg-primary/10',
                        )}
                        onClick={puedeReservar ? () => handleClickSlot(pista, franja, filaIdx) : undefined}
                      >
                        {esHoraEnPunto && precio !== undefined && precio > 0 && (
                          <span className="text-[9px] text-muted-foreground/60 pl-0.5">
                            {precio}€
                          </span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Sheet de confirmacion */}
      <ConfirmacionReserva
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        pista={slotSeleccionado?.pista ?? null}
        fecha={fecha}
        horaInicio={slotSeleccionado?.horaInicio ?? ''}
        duracion={duracion}
        precio={slotSeleccionado?.precio ?? null}
        slug={slug}
        onReservaConfirmada={cargarDatos}
      />
    </div>
  );
}
