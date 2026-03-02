'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import GridReservas from '@/components/club/GridReservas';

interface Court {
  id: string;
  name: string;
  type: string;
}

export default function PlayerBookingPage() {
  const params = useParams();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [clubInfo, setClubInfo] = useState<any>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [clubRes, courtsRes] = await Promise.all([
          fetch(`/api/club/${slug}`),
          fetch(`/api/club/${slug}/courts`),
        ]);
        if (clubRes.ok) setClubInfo(await clubRes.json());
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
          bookingPaymentMode: clubInfo.bookingPaymentMode || 'presential',
          stripeConnectOnboarded: clubInfo.stripeConnectOnboarded || false,
        }}
        pistas={courts}
        sesionUserId={session?.user?.id ?? null}
        slug={slug}
      />
    </div>
  );
}
