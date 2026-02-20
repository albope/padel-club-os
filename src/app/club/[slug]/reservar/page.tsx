'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CalendarDays, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Court {
  id: string;
  name: string;
  type: string;
}

// Genera slots de 90 minutos dentro del horario del club
function generateSlots(openingTime: string, closingTime: string) {
  const slots: string[] = [];
  const [startH] = openingTime.split(':').map(Number);
  const [endH] = closingTime.split(':').map(Number);
  for (let h = startH; h < endH; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h + 1 < endH) {
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
  }
  return slots;
}

export default function PlayerBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [courts, setCourts] = useState<Court[]>([]);
  const [clubInfo, setClubInfo] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // Cargar datos del club y pistas
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [clubRes, courtsRes] = await Promise.all([
          fetch(`/api/club/${slug}`),
          fetch(`/api/club/${slug}/courts`),
        ]);
        if (clubRes.ok) setClubInfo(await clubRes.json());
        if (courtsRes.ok) {
          const courtsData = await courtsRes.json();
          setCourts(courtsData);
          if (courtsData.length > 0) setSelectedCourt(courtsData[0].id);
        }
      } catch {
        toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  // Cargar reservas existentes cuando cambia fecha o pista
  useEffect(() => {
    if (!selectedCourt || !selectedDate || !clubInfo) return;
    async function loadBookings() {
      try {
        // Obtenemos las reservas del dia para la pista seleccionada via la API del club
        const dateStart = new Date(`${selectedDate}T00:00:00`);
        const dateEnd = new Date(`${selectedDate}T23:59:59`);
        // Usamos la API de reservas del jugador si esta autenticado
        if (session?.user) {
          const res = await fetch('/api/player/bookings');
          if (res.ok) {
            const data = await res.json();
            setExistingBookings(data.filter((b: any) =>
              b.courtId === selectedCourt &&
              new Date(b.startTime) >= dateStart &&
              new Date(b.startTime) <= dateEnd
            ));
          }
        }
      } catch { /* silenciar */ }
    }
    loadBookings();
  }, [selectedCourt, selectedDate, clubInfo, session]);

  const handleBook = async () => {
    if (!session?.user) {
      router.push(`/club/${slug}/login`);
      return;
    }

    if (!selectedCourt || !selectedSlot) return;

    setIsBooking(true);
    try {
      const [hours, minutes] = selectedSlot.split(':').map(Number);
      const startTime = new Date(`${selectedDate}T${selectedSlot}:00`);
      const endTime = new Date(startTime.getTime() + 90 * 60 * 1000);

      const res = await fetch('/api/player/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: selectedCourt,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      if (res.ok) {
        toast({ title: "Reserva confirmada", description: "Tu pista ha sido reservada.", variant: "default" });
        setSelectedSlot(null);
        router.refresh();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "No se pudo crear la reserva.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexion.", variant: "destructive" });
    } finally {
      setIsBooking(false);
    }
  };

  // Generar fechas para los proximos 7 dias
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const slots = clubInfo
    ? generateSlots(clubInfo.openingTime || '09:00', clubInfo.closingTime || '23:00')
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reservar pista</h1>
        <p className="text-muted-foreground">Selecciona dia, pista y horario</p>
      </div>

      {/* Selector de fecha */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((date) => {
          const d = new Date(date + 'T12:00:00');
          return (
            <button
              key={date}
              onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
              className={cn(
                'flex flex-col items-center px-4 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors shrink-0',
                selectedDate === date
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted border-border'
              )}
            >
              <span className="text-xs uppercase">
                {d.toLocaleDateString('es-ES', { weekday: 'short' })}
              </span>
              <span className="font-bold text-lg">
                {d.getDate()}
              </span>
              <span className="text-xs">
                {d.toLocaleDateString('es-ES', { month: 'short' })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selector de pista */}
      <div className="flex gap-2 flex-wrap">
        {courts.map((court) => (
          <Button
            key={court.id}
            variant={selectedCourt === court.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setSelectedCourt(court.id); setSelectedSlot(null); }}
          >
            {court.name}
            <Badge variant="secondary" className="ml-2 text-xs">{court.type}</Badge>
          </Button>
        ))}
      </div>

      {/* Grid de horarios */}
      {selectedCourt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {slots.map((slot) => {
                // Por ahora marcamos todos como disponibles; en el futuro se cruzara con bookings reales
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(isSelected ? null : slot)}
                    className={cn(
                      'py-2 px-3 rounded-md text-sm font-medium border transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted border-border text-foreground'
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boton de reservar */}
      {selectedSlot && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <p className="font-medium">
                {courts.find(c => c.id === selectedCourt)?.name} ·{' '}
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-ES', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedSlot} - 90 minutos
              </p>
            </div>
            <Button onClick={handleBook} disabled={isBooking}>
              {isBooking ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Reservando...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Reservar</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
