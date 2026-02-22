'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CalendarDays, Clock, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [isBooking, setIsBooking] = useState(false);

  if (!pista) return null;

  const startTime = new Date(`${fecha}T${horaInicio}:00`);
  const endTime = new Date(startTime.getTime() + duracion * 60 * 1000);

  const horaFin = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

  const fechaFormateada = startTime.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleReservar = async () => {
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
        }),
      });

      if (res.ok) {
        toast({
          title: "Reserva confirmada",
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
        description: "Error de conexion.",
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
          <SheetTitle>Confirmar reserva</SheetTitle>
          <SheetDescription>
            Revisa los detalles antes de confirmar
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
                <span className="text-sm text-muted-foreground">Precio</span>
                <span className="text-lg font-bold">{precio.toFixed(2)}€</span>
              </div>
            </>
          )}

          <Separator />

          {!session?.user ? (
            <Button
              className="w-full"
              onClick={() => router.push(`/club/${slug}/login`)}
            >
              Iniciar sesion para reservar
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleReservar}
              disabled={isBooking}
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reservando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar reserva
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
