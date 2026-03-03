'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarDays, Clock, MapPin, Loader2, CheckCircle2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

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
  bookingPaymentMode: string;
  stripeConnectOnboarded: boolean;
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
  bookingPaymentMode,
  stripeConnectOnboarded,
}: ConfirmacionReservaProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const t = useTranslations('booking');
  const tStripe = useTranslations('stripeConnect');
  const locale = useLocale();
  const localeCode = locale === 'en' ? 'en-GB' : 'es-ES';
  const [isBooking, setIsBooking] = useState(false);

  // Mostrar toast segun resultado del pago (query params de retorno de Stripe)
  useEffect(() => {
    const pago = searchParams.get('pago');
    if (pago === 'exito') {
      toast({
        title: tStripe('paymentConfirmed'),
        description: tStripe('paymentConfirmedDesc'),
        variant: "success",
      });
      onReservaConfirmada();
      // Limpiar query params
      router.replace(`/club/${slug}/reservar`, { scroll: false });
    } else if (pago === 'cancelado') {
      toast({
        title: tStripe('paymentCancelled'),
        description: tStripe('paymentCancelledDesc'),
      });
      router.replace(`/club/${slug}/reservar`, { scroll: false });
    }
  }, [searchParams, slug, router, onReservaConfirmada]);

  if (!pista) return null;

  const startTime = new Date(`${fecha}T${horaInicio}:00`);
  const endTime = new Date(startTime.getTime() + duracion * 60 * 1000);

  const horaFin = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

  const fechaFormateada = startTime.toLocaleDateString(localeCode, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Determinar modo de pago
  const modoOnline = bookingPaymentMode !== 'presential' && stripeConnectOnboarded;
  const modoBoth = bookingPaymentMode === 'both' && stripeConnectOnboarded;
  const modoSoloOnline = bookingPaymentMode === 'online' && stripeConnectOnboarded;

  const handleReservar = async (payAtClub?: boolean) => {
    if (!session?.user) {
      router.push(`/club/${slug}/login`);
      return;
    }

    setIsBooking(true);
    try {
      const res = await fetch('/api/player/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: pista.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          payAtClub: payAtClub ?? false,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Si requiere pago online, redirigir a Stripe Checkout
        if (data.requiresPayment && !payAtClub) {
          const checkoutRes = await fetch('/api/player/bookings/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: data.id }),
          });

          if (checkoutRes.ok) {
            const { url } = await checkoutRes.json();
            window.location.href = url;
            return; // No cerrar el sheet, se redirige
          } else {
            toast({
              title: tStripe('paymentError'),
              description: tStripe('paymentErrorDesc'),
              variant: "destructive",
            });
            onOpenChange(false);
            onReservaConfirmada();
            return;
          }
        }

        // Flujo presencial o pago en club
        toast({
          title: t('confirmed'),
          description: `${pista.name} · ${horaInicio} - ${horaFin}`,
          variant: "default",
        });
        onOpenChange(false);
        onReservaConfirmada();
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "No se pudo crear la reserva.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Error de conexión.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl max-h-[80vh]">
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
                <span className="text-lg font-bold">{precio.toFixed(2)}€</span>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {t('perPlayer')}: {(precio / 4).toFixed(2)}€ (4 jug.) · {(precio / 2).toFixed(2)}€ (2 jug.)
              </p>
            </>
          )}

          <Separator />

          {!session?.user ? (
            <Button
              className="w-full"
              onClick={() => router.push(`/club/${slug}/login`)}
            >
              {t('loginToBook')}
            </Button>
          ) : modoSoloOnline ? (
            <Button
              className="w-full"
              onClick={() => handleReservar(false)}
              disabled={isBooking}
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {tStripe('payAndBook')}{precio !== null && precio > 0 ? ` (${precio.toFixed(2)}€)` : ''}
                </>
              )}
            </Button>
          ) : modoBoth ? (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => handleReservar(false)}
                disabled={isBooking}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('processing')}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {tStripe('payNow')}{precio !== null && precio > 0 ? ` (${precio.toFixed(2)}€)` : ''}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleReservar(true)}
                disabled={isBooking}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {tStripe('payAtClub')}
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
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
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t('confirmBooking')}
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
