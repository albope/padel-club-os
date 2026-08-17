'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarDays, CalendarPlus, Clock, MapPin, Loader2, CheckCircle2, CircleAlert, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { temaMarcadorActivo } from '@/lib/feature-flags';
import BotonCompartir from '@/components/club/BotonCompartir';

interface ConfirmacionReservaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pista: { id: string; name: string; type: string } | null;
  fecha: string;
  horaInicio: string;
  duracion: number;
  precio: number | null;
  slug: string;
  onReservaConfirmada: () => void;
}

export default function ConfirmacionReserva({
  open,
  onOpenChange,
  pista,
  fecha,
  horaInicio,
  duracion,
  precio,
  slug,
  onReservaConfirmada,
}: ConfirmacionReservaProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations('booking');
  const tShare = useTranslations('share');
  const locale = useLocale();
  const localeCode = locale === 'en' ? 'en-GB' : 'es-ES';
  const [isBooking, setIsBooking] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [errorReserva, setErrorReserva] = useState<string | null>(null);

  // «Marcador»: la CTA primaria del jugador es superficie de tenant (h-12 tactil)
  const claseCtaTenant = temaMarcadorActivo() ? 'btn-tenant h-12' : undefined;

  // Datos derivados (calculados antes del early return para usarlos en el useEffect)
  const startTime = pista ? new Date(`${fecha}T${horaInicio}:00`) : null;
  const endTime = startTime ? new Date(startTime.getTime() + duracion * 60 * 1000) : null;
  const horaFin = endTime
    ? `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`
    : '';
  const fechaFormateada = startTime
    ? startTime.toLocaleDateString(localeCode, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Datos para compartir reserva (enlace generico a la seccion, no deep link)
  const datosCompartir = pista ? {
    titulo: tShare('bookingTitle'),
    texto: tShare('bookingText', {
      court: pista.name,
      date: fechaFormateada,
      startTime: horaInicio,
      endTime: horaFin,
    }),
    url: typeof window !== 'undefined' ? `${window.location.origin}/club/${slug}/reservar` : '',
  } : null;

  const googleCalendarUrl = pista && startTime && endTime
    ? `https://calendar.google.com/calendar/render?${new URLSearchParams({
        action: 'TEMPLATE',
        text: `${tShare('bookingTitle')} · ${pista.name}`,
        dates: `${startTime.toISOString().replace(/[-:]|\.\d{3}/g, '')}/${endTime.toISOString().replace(/[-:]|\.\d{3}/g, '')}`,
        details: tShare('bookingText', {
          court: pista.name,
          date: fechaFormateada,
          startTime: horaInicio,
          endTime: horaFin,
        }),
        location: pista.name,
      }).toString()}`
    : null;

  if (!pista || !startTime || !endTime) return null;

  const handleReservar = async () => {
    if (!session?.user) {
      router.push(`/club/${slug}/login`);
      return;
    }

    setIsBooking(true);
    setErrorReserva(null);
    try {
      const res = await fetch('/api/player/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: pista.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      if (res.ok) {
        // La reserva queda confirmada y se cobra presencialmente en el club.
        setErrorReserva(null);
        setReservaExitosa(true);
        onReservaConfirmada();
      } else {
        const data = await res.json().catch(() => null);
        setErrorReserva(data?.error || t('bookingErrorRetry'));
      }
    } catch {
      setErrorReserva(t('connectionErrorRetry'));
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(value) => {
      if (!value) {
        setReservaExitosa(false);
        setErrorReserva(null);
      }
      onOpenChange(value);
    }}>
      <SheetContent side="bottom" className="rounded-t-xl max-h-[80vh]">
        {reservaExitosa ? (
          <>
            <SheetHeader>
              <SheetTitle className="sr-only">{tShare('bookingConfirmed')}</SheetTitle>
              <SheetDescription className="sr-only">{tShare('bookingConfirmedDesc')}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-success-border bg-success-bg">
                  <CheckCircle2 className="h-10 w-10 text-success-foreground animate-in zoom-in duration-[400ms] motion-reduce:animate-none" />
                </div>
                <h3 className="text-lg font-semibold">{tShare('bookingConfirmed')}</h3>
                <p className="text-sm text-muted-foreground">{tShare('bookingConfirmedDesc')}</p>
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium">{pista.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm capitalize">{fechaFormateada}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm">{horaInicio} - {horaFin}</p>
                </div>
              </div>

              {datosCompartir && (
                <BotonCompartir
                  datos={datosCompartir}
                  variant="default"
                  size="default"
                  className="w-full"
                  mostrarTexto
                />
              )}
              {googleCalendarUrl && (
                <Button asChild variant="outline" className="w-full">
                  <a href={googleCalendarUrl} target="_blank" rel="noreferrer">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    {tShare('addToCalendar')}
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                {tShare('close')}
              </Button>
            </div>
          </>
        ) : (
          <>
        <SheetHeader>
          <SheetTitle>{t('confirmBooking')}</SheetTitle>
          <SheetDescription>
            {t('reviewDetails')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">{pista.name}</p>
                <p className="text-sm text-muted-foreground">{pista.type}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm capitalize">{fechaFormateada}</p>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm">
                {horaInicio} - {horaFin} ({duracion} min)
              </p>
            </div>
          </div>

          {precio !== null && precio > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('price')}</span>
                <span className="text-lg font-bold tabular-nums">{precio.toFixed(2)}€</span>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {t('perPlayer')}: {(precio / 4).toFixed(2)}€ (4 jug.) · {(precio / 2).toFixed(2)}€ (2 jug.)
              </p>
            </>
          )}

          <Separator />

          {errorReserva && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive"
            >
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">{t('bookingFailed')}</p>
                <p className="mt-0.5 text-sm">{errorReserva}</p>
              </div>
            </div>
          )}

          {!session?.user ? (
            <Button
              className={cn('w-full', claseCtaTenant)}
              onClick={() => router.push(`/club/${slug}/login`)}
            >
              {t('loginToBook')}
            </Button>
          ) : (
            <Button
              className={cn('w-full', claseCtaTenant)}
              onClick={() => handleReservar()}
              disabled={isBooking}
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('booking')}
                </>
              ) : (
                <>
                  {errorReserva ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('retryBooking')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t('confirmBooking')}
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
