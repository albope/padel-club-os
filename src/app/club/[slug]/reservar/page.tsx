'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import GridReservas from '@/components/club/GridReservas';
import { esFechaISOValida, formatearFechaLocal } from '@/lib/fechas';

interface Court {
  id: string;
  name: string;
  type: string;
}

interface ReservaInicial {
  fecha: string | null;
  pistaId: string | null;
  hora: string | null;
}

// Lee la fecha y la preferencia opcional de repeticion. Los valores invalidos
// no llegan al grid y este conserva su comportamiento normal.
function reservaDesdeQuery(maxAdvanceBooking: number): ReservaInicial {
  const params = new URLSearchParams(window.location.search);
  const fecha = params.get('fecha');
  if (!fecha || !esFechaISOValida(fecha)) {
    return { fecha: null, pistaId: null, hora: null };
  }

  const hoy = formatearFechaLocal(new Date());
  const limite = new Date();
  limite.setDate(limite.getDate() + maxAdvanceBooking);
  if (fecha < hoy || fecha > formatearFechaLocal(limite)) {
    return { fecha: null, pistaId: null, hora: null };
  }

  const pistaId = params.get('pista')?.trim() || null;
  const hora = params.get('hora');
  const horaValida = hora && /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(hora) ? hora : null;

  return {
    fecha,
    pistaId: pistaId && horaValida ? pistaId : null,
    hora: pistaId ? horaValida : null,
  };
}

export default function PlayerBookingPage() {
  const params = useParams();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [clubInfo, setClubInfo] = useState<any>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [fechaInicial, setFechaInicial] = useState<string | null>(null);
  const [pistaInicialId, setPistaInicialId] = useState<string | null>(null);
  const [horaInicial, setHoraInicial] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [clubRes, courtsRes] = await Promise.all([
          fetch(`/api/club/${slug}`),
          fetch(`/api/club/${slug}/courts`),
        ]);
        if (clubRes.ok) {
          const info = await clubRes.json();
          setClubInfo(info);
          const reservaInicial = reservaDesdeQuery(info.maxAdvanceBooking ?? 7);
          setFechaInicial(reservaInicial.fecha);
          setPistaInicialId(reservaInicial.pistaId);
          setHoraInicial(reservaInicial.hora);
        }
        if (courtsRes.ok) setCourts(await courtsRes.json());
      } catch {
        // Error silencioso, el grid mostrara estado vacio
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!clubInfo) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se pudo cargar la información del club.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Reservar pista</h1>
        <p className="text-muted-foreground mt-1">
          Selecciona un horario disponible para reservar
        </p>
        <div className="club-accent-line mt-3" />
      </div>

      <GridReservas
        club={{
          slug,
          primaryColor: clubInfo.primaryColor,
          openingTime: clubInfo.openingTime,
          closingTime: clubInfo.closingTime,
          bookingDuration: clubInfo.bookingDuration,
        }}
        pistas={courts}
        sesionUserId={session?.user?.id ?? null}
        slug={slug}
        fechaInicial={fechaInicial}
        pistaInicialId={pistaInicialId}
        horaInicial={horaInicial}
      />
    </div>
  );
}
