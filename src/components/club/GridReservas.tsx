'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, Loader2, Users, Bell, BellOff, Ban, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { calcularPrecioTotal, type BandaPrecio } from '@/lib/pricing-client';
import { formatearFechaLocal } from '@/lib/fechas';
import ConfirmacionReserva from './ConfirmacionReserva';

interface Pista {
  id: string;
  name: string;
  type: string;
}

interface Bloque {
  courtId: string;
  tipo: 'reserva' | 'partida-abierta' | 'bloqueo';
  inicio: string;
  fin: string;
  esPropia: boolean;
  plazasLibres?: number;
  nivelMin?: number | null;
  nivelMax?: number | null;
  openMatchId?: string;
  reason?: string;
  note?: string;
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
  fechaInicial?: string | null;
  pistaInicialId?: string | null;
  horaInicial?: string | null;
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

function sumarMinutosAHora(hora: string, minutos: number): string {
  const total = horaAMinutos(hora) + minutos;
  const horas = Math.floor(total / 60) % 24;
  const minutosRestantes = total % 60;
  return `${String(horas).padStart(2, '0')}:${String(minutosRestantes).padStart(2, '0')}`;
}

export default function GridReservas({
  club,
  pistas,
  sesionUserId,
  slug,
  fechaInicial,
  pistaInicialId,
  horaInicial,
}: GridReservasProps) {
  const router = useRouter();
  const t = useTranslations('booking');
  const tw = useTranslations('waitlist');
  const locale = useLocale();
  const localeCode = locale === 'en' ? 'en-GB' : 'es-ES';
  const openingTime = club.openingTime || '09:00';
  const closingTime = club.closingTime || '23:00';
  const duracion = club.bookingDuration || 90;
  const aperturaMinutos = horaAMinutos(openingTime);

  const [fecha, setFecha] = useState(() => {
    if (fechaInicial) return fechaInicial;
    return formatearFechaLocal(new Date());
  });
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [bandasPrecio, setBandasPrecio] = useState<Record<string, BandaPrecio[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState<{
    pista: Pista;
    horaInicio: string;
    precio: number | null;
  } | null>(null);

  // Lista de espera: Set de claves "courtId-startTimeISO" → waitlistId
  const [waitlistMap, setWaitlistMap] = useState<Map<string, string>>(new Map());
  const [waitlistLoading, setWaitlistLoading] = useState<Set<string>>(new Set());
  const preseleccionAplicada = useRef(false);

  const hoy = useMemo(() => formatearFechaLocal(new Date()), []);
  const franjas = useMemo(() => generarFranjas(openingTime, closingTime), [openingTime, closingTime]);
  const totalFilas = franjas.length;
  const filasSeleccionadas = Math.ceil(duracion / 30);
  const filaInicioSeleccionada = slotSeleccionado
    ? indiceFila(slotSeleccionado.horaInicio, aperturaMinutos)
    : null;

  // <<Marcador>> 2b: chips de dia (proximos 7 dias)
  const proximosDias = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(`${hoy}T12:00:00`);
      d.setDate(d.getDate() + i);
      return {
        iso: formatearFechaLocal(d),
        diaSemana: d.toLocaleDateString(localeCode, { weekday: 'short' }).replace('.', ''),
        diaMes: d.getDate(),
      };
    });
  }, [hoy, localeCode]);

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

      // Fetch bandas de precio de todas las pistas en paralelo
      const bandasPorPista: Record<string, BandaPrecio[]> = {};
      const precioPromises = pistas.map(async (pista) => {
        const res = await fetch(`/api/club/${slug}/pricing?courtId=${pista.id}&date=${fecha}`);
        if (res.ok) {
          const data: BandaPrecio[] = await res.json();
          bandasPorPista[pista.id] = data;
        }
      });
      await Promise.all(precioPromises);
      setBandasPrecio(bandasPorPista);
    } catch {
      setBloques([]);
    } finally {
      setIsLoading(false);
    }
  }, [fecha, slug, pistas]);

  // Cargar entradas de lista de espera del usuario
  const cargarWaitlist = useCallback(async () => {
    if (!sesionUserId) return;
    try {
      const res = await fetch('/api/player/bookings/waitlist');
      if (res.ok) {
        const data = await res.json();
        const mapa = new Map<string, string>();
        for (const entrada of data) {
          mapa.set(`${entrada.courtId}-${entrada.startTime}`, entrada.id);
        }
        setWaitlistMap(mapa);
      }
    } catch {
      // silencioso
    }
  }, [sesionUserId]);

  useEffect(() => {
    if (pistas.length > 0) {
      cargarDatos();
      cargarWaitlist();
    }
  }, [cargarDatos, cargarWaitlist, pistas.length]);

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
    cambiarFecha(formatearFechaLocal(d));
  };

  const cambiarFecha = (nuevaFecha: string) => {
    setFecha(nuevaFecha);
    setSlotSeleccionado(null);
    setSheetOpen(false);
  };

  const esPropia = (bloque: Bloque): boolean => bloque.esPropia;

  // Verificar que un slot esta libre para la duracion completa
  const slotLibre = useCallback((pistaId: string, filaIdx: number): boolean => {
    const filasNecesarias = Math.ceil(duracion / 30);
    for (let f = filaIdx; f < filaIdx + filasNecesarias; f++) {
      if (f >= totalFilas) return false;
      if (celdasOcupadas.has(`${pistaId}-${f}`)) return false;
    }
    return true;
  }, [celdasOcupadas, duracion, totalFilas]);

  const handleClickSlot = useCallback((pista: Pista, franja: string, filaIdx: number) => {
    if (!slotLibre(pista.id, filaIdx)) return;

    const bandas = bandasPrecio[pista.id] ?? [];
    const precioTotal = calcularPrecioTotal(bandas, franja, duracion);

    setSlotSeleccionado({
      pista,
      horaInicio: franja,
      precio: precioTotal,
    });
  }, [bandasPrecio, duracion, slotLibre]);

  useEffect(() => {
    if (preseleccionAplicada.current || isLoading || !pistaInicialId || !horaInicial) return;
    preseleccionAplicada.current = true;

    const pista = pistas.find((candidata) => candidata.id === pistaInicialId);
    const filaIdx = franjas.indexOf(horaInicial);
    if (!pista || filaIdx < 0 || !slotLibre(pista.id, filaIdx)) {
      toast({
        title: t('repeatUnavailableTitle'),
        description: t('repeatUnavailableDescription'),
        variant: 'destructive',
      });
      return;
    }

    handleClickSlot(pista, horaInicial, filaIdx);
  }, [franjas, handleClickSlot, horaInicial, isLoading, pistaInicialId, pistas, slotLibre, t]);

  const handlePartidaAbierta = (openMatchId: string) => {
    router.push(`/club/${slug}/partidas`);
  };

  const handleToggleWaitlist = async (courtId: string, bloque: Bloque) => {
    const clave = `${courtId}-${bloque.inicio}`;
    const existeId = waitlistMap.get(clave);

    setWaitlistLoading((prev) => new Set(prev).add(clave));
    try {
      if (existeId) {
        // Salir de la lista de espera
        const res = await fetch(`/api/player/bookings/waitlist/${existeId}`, { method: 'DELETE' });
        if (res.ok) {
          setWaitlistMap((prev) => {
            const next = new Map(prev);
            next.delete(clave);
            return next;
          });
          toast({ title: tw('removed') });
        }
      } else {
        // Apuntarse a la lista de espera
        const res = await fetch('/api/player/bookings/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courtId,
            startTime: bloque.inicio,
            endTime: bloque.fin,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setWaitlistMap((prev) => new Map(prev).set(clave, data.id));
          toast({ title: tw('added'), variant: 'success' });
        } else {
          const data = await res.json().catch(() => null);
          toast({
            title: 'Error',
            description: data?.error || tw('error'),
            variant: 'destructive',
          });
        }
      }
    } catch {
      toast({ title: 'Error', description: tw('error'), variant: 'destructive' });
    } finally {
      setWaitlistLoading((prev) => {
        const next = new Set(prev);
        next.delete(clave);
        return next;
      });
    }
  };

  const fechaFormateada = new Date(`${fecha}T12:00:00`).toLocaleDateString(localeCode, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Navegacion de fecha */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-3">
        <Button variant="ghost" size="icon" onClick={() => moverFecha(-1)} aria-label={t('previousDay')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 text-center">
          <span className="font-semibold capitalize text-sm sm:text-base">
            {fechaFormateada}
          </span>
          {fecha === hoy ? (
            <span className="inline-flex h-7 items-center rounded-[var(--radius-control)] border border-primary/30 bg-primary/5 px-2.5 text-xs font-semibold text-primary">
              {t('today')}
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => cambiarFecha(hoy)}
            >
              {t('backToToday')}
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => moverFecha(1)} aria-label={t('nextDay')}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* <<Marcador>> 2b: chips de dia */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t('date')}>
        {proximosDias.map((dia) => {
          const seleccionado = fecha === dia.iso;
          return (
            <button
              type="button"
              key={dia.iso}
              onClick={() => cambiarFecha(dia.iso)}
              aria-pressed={seleccionado}
              className={cn(
                'flex h-14 min-w-[52px] shrink-0 flex-col items-center justify-center rounded-[10px] border text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                seleccionado
                  ? 'border-foreground bg-foreground font-semibold text-background'
                  : 'border-border bg-card text-foreground hover:border-border-strong'
              )}
            >
              <span className="text-[10px] uppercase tracking-[0.06em] opacity-70">{dia.diaSemana}</span>
              <span className="text-sm font-semibold tabular-nums">{dia.diaMes}</span>
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-3 sm:gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border border-dashed border-border-strong bg-card" />
          <span className="text-muted-foreground">{t('available')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="celda-ocupada h-3 w-3 rounded-sm border border-border" />
          <span className="text-muted-foreground">{t('occupied')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border border-foreground bg-foreground" />
          <span className="text-muted-foreground">{t('yourBooking')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border-[1.5px] border-primary bg-primary/5" />
          <span className="text-muted-foreground">{t('openMatch')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border border-border bg-secondary" />
          <span className="text-muted-foreground">{t('blocked')}</span>
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
          {t('noCourts')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `60px repeat(${pistas.length}, minmax(100px, 1fr))`,
              gridTemplateRows: `auto repeat(${totalFilas}, 2.75rem)`,
              minWidth: `${60 + pistas.length * 100}px`,
            }}
          >
            {/* Header: celda vacia + nombres de pistas */}
            <div className="sticky left-0 z-20 bg-muted border-b border-r p-2 text-xs font-medium text-muted-foreground flex items-center justify-center">
              {t('hour')}
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
                    const esParteSeleccion = slotSeleccionado?.pista.id === pista.id
                      && filaInicioSeleccionada !== null
                      && filaIdx >= filaInicioSeleccionada
                      && filaIdx < filaInicioSeleccionada + filasSeleccionadas;
                    const esInicioSeleccionado = esParteSeleccion && filaIdx === filaInicioSeleccionada;

                    // Si hay un bloque que empieza aqui, renderizar el bloque
                    if (bloqueInicial) {
                      const { bloque, filas } = bloqueInicial;
                      const propia = esPropia(bloque);
                      const esPartida = bloque.tipo === 'partida-abierta';
                      const inicio = new Date(bloque.inicio);
                      const fin = new Date(bloque.fin);
                      const horaInicioStr = `${String(inicio.getHours()).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}`;
                      const horaFinStr = `${String(fin.getHours()).padStart(2, '0')}:${String(fin.getMinutes()).padStart(2, '0')}`;

                      const gridStyle = {
                        gridRow: `${filaIdx + 2} / span ${filas}`,
                        gridColumn: colIdx + 2,
                      };

                      if (esPartida) {
                        return (
                          <button
                            type="button"
                            key={celdaKey}
                            style={gridStyle}
                            className="mx-0.5 my-px flex w-full cursor-pointer select-none flex-col items-center justify-center overflow-hidden rounded-[6px] border-[1.5px] border-primary bg-primary/5 text-left text-[10px] font-medium text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            onClick={() => handlePartidaAbierta(bloque.openMatchId!)}
                            aria-label={`Ver partida abierta de ${horaInicioStr} a ${horaFinStr}, ${bloque.plazasLibres} plazas libres`}
                          >
                            <span className="font-semibold leading-tight">
                              {horaInicioStr}-{horaFinStr}
                            </span>
                            <span className="flex items-center gap-0.5 leading-tight">
                              <Users className="h-2.5 w-2.5" />
                              {bloque.plazasLibres} {t('free')}
                            </span>
                            {bloque.nivelMin != null && (
                              <span className="opacity-75 leading-tight">
                                {t('level')} {bloque.nivelMin}-{bloque.nivelMax}
                              </span>
                            )}
                          </button>
                        );
                      }

                      // Bloqueo de pista
                      if (bloque.tipo === 'bloqueo') {
                        const motivoMap: Record<string, string> = {
                          MAINTENANCE: t('blockMaintenance'),
                          HOLIDAY: t('blockHoliday'),
                          EVENT: t('blockEvent'),
                          OTHER: t('blockOther'),
                        };
                        const motivoTexto = motivoMap[bloque.reason || ''] || bloque.reason || '';
                        return (
                          <div
                            key={celdaKey}
                            style={gridStyle}
                            className="mx-0.5 my-px flex select-none flex-col items-center justify-center overflow-hidden rounded-[6px] border border-border bg-secondary text-[10px] font-medium text-muted-foreground"
                            title={bloque.note || motivoTexto}
                          >
                            <span className="flex items-center gap-0.5 leading-tight">
                              <Ban className="h-2.5 w-2.5" />
                              {motivoTexto}
                            </span>
                          </div>
                        );
                      }

                      const waitlistClave = `${bloque.courtId}-${bloque.inicio}`;
                      const enWaitlist = waitlistMap.has(waitlistClave);
                      const waitlistCargando = waitlistLoading.has(waitlistClave);
                      const mostrarWaitlist = !propia && sesionUserId && bloque.tipo === 'reserva';

                      return (
                        <div
                          key={celdaKey}
                          style={gridStyle}
                          className={cn(
                            'relative mx-0.5 my-px flex select-none flex-col items-center justify-center overflow-hidden rounded-[6px] border text-[10px] font-medium',
                            propia && 'border-foreground bg-foreground text-background',
                            !propia && 'celda-ocupada border-border text-muted-foreground',
                          )}
                        >
                          <span className="font-semibold leading-tight">
                            {horaInicioStr}-{horaFinStr}
                          </span>
                          {propia && (
                            <span className="leading-tight">{t('yourBooking')}</span>
                          )}
                          {mostrarWaitlist && (
                            <button
                              type="button"
                              className={cn(
                                'absolute bottom-0 right-0 flex h-11 w-11 items-end justify-end rounded-sm p-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                enWaitlist
                                  ? 'text-warning-foreground hover:bg-warning-bg'
                                  : 'text-muted-foreground hover:bg-secondary',
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleWaitlist(bloque.courtId, bloque);
                              }}
                              disabled={waitlistCargando}
                              aria-label={enWaitlist ? tw('leave') : tw('join')}
                              title={enWaitlist ? tw('leave') : tw('join')}
                            >
                              {waitlistCargando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : enWaitlist ? (
                                <BellOff className="h-4 w-4" />
                              ) : (
                                <Bell className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    }

                    // Si la celda esta ocupada por un bloque que empezo antes, no renderizar nada
                    if (estaOcupada) return null;

                    // Celda libre
                    const puedeReservar = slotLibre(pista.id, filaIdx);

                    const gridStyle = {
                      gridRow: filaIdx + 2,
                      gridColumn: colIdx + 2,
                    };

                    // Mostrar precio total del booking en celdas de hora en punto reservables
                    const precioTotal = esHoraEnPunto && puedeReservar
                      ? calcularPrecioTotal(bandasPrecio[pista.id] ?? [], franja, duracion)
                      : null;
                    const contenidoPrecio = precioTotal !== null && precioTotal > 0 ? (
                      <span className={cn(
                        'text-[9px] pl-0.5',
                        esParteSeleccion ? 'text-background' : 'text-muted-foreground/60',
                      )}>
                        {precioTotal % 1 === 0 ? precioTotal : precioTotal.toFixed(2)}€
                      </span>
                    ) : null;

                    if (puedeReservar) {
                      return (
                        <button
                          type="button"
                          key={celdaKey}
                          style={gridStyle}
                          className={cn(
                            'm-0.5 flex w-full cursor-pointer items-center justify-center rounded-[6px] border border-dashed border-border-strong transition-colors hover:border-primary hover:bg-primary/5 active:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                            esParteSeleccion && 'border-solid border-foreground bg-foreground text-background hover:border-foreground hover:bg-foreground',
                          )}
                          onClick={() => handleClickSlot(pista, franja, filaIdx)}
                          aria-pressed={esInicioSeleccionado}
                          aria-label={`Reservar ${pista.name} a las ${franja}${precioTotal ? `, ${precioTotal}€` : ''}`}
                        >
                          {esInicioSeleccionado && <Check className="mr-0.5 h-3 w-3" aria-hidden="true" />}
                          {contenidoPrecio}
                        </button>
                      );
                    }

                    return (
                      <div
                        key={celdaKey}
                        style={gridStyle}
                        className={cn(
                          'border-r border-b border-border/20 transition-colors',
                          esHoraEnPunto && 'border-t border-t-border/40',
                          esParteSeleccion && 'border-foreground bg-foreground',
                        )}
                      >
                        {contenidoPrecio}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {slotSeleccionado && (
        <div
          className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-[14px] bg-foreground p-3.5 text-background shadow-xl md:bottom-4"
          role="region"
          aria-label={t('selectionSummary')}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-background/60">
              {t('selection')}
            </p>
            <p className="truncate text-sm font-semibold tabular-nums">
              {slotSeleccionado.pista.name} · {slotSeleccionado.horaInicio}–{sumarMinutosAHora(slotSeleccionado.horaInicio, duracion)}
              {slotSeleccionado.precio !== null && slotSeleccionado.precio > 0 && (
                <> · <span className="text-base font-bold">{slotSeleccionado.precio.toFixed(2)}€</span></>
              )}
            </p>
          </div>
          <Button
            type="button"
            className="btn-tenant h-11 shrink-0 px-5"
            onClick={() => setSheetOpen(true)}
          >
            {t('continue')}
          </Button>
        </div>
      )}

      {/* Sheet de confirmacion */}
      <ConfirmacionReserva
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSlotSeleccionado(null);
        }}
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
