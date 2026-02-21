'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Club } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

const SettingsSchema = z.object({
  name: z.string().min(3, "El nombre del club es requerido."),
  openingTime: z.string(),
  closingTime: z.string(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email no valido").optional().or(z.literal("")),
  maxAdvanceBooking: z.coerce.number().int().min(1).max(90).optional(),
  cancellationHours: z.coerce.number().int().min(0).max(72).optional(),
  enableOpenMatches: z.boolean().optional(),
  enablePlayerBooking: z.boolean().optional(),
  bookingPaymentMode: z.enum(["presential", "online", "both"]).optional(),
});

interface SettingsFormProps {
  club: Club;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ club }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      name: club.name || '',
      openingTime: club.openingTime || '09:00',
      closingTime: club.closingTime || '23:00',
      description: club.description || '',
      phone: club.phone || '',
      email: club.email || '',
      maxAdvanceBooking: club.maxAdvanceBooking ?? 7,
      cancellationHours: club.cancellationHours ?? 2,
      enableOpenMatches: club.enableOpenMatches ?? true,
      enablePlayerBooking: club.enablePlayerBooking ?? true,
      bookingPaymentMode: (club.bookingPaymentMode as "presential" | "online" | "both") ?? "presential",
    },
  });

  const onSubmit = async (values: z.infer<typeof SettingsSchema>) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/club', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('No se pudieron guardar los ajustes.');
      }

      toast({ title: "Ajustes guardados", description: "Los ajustes se han guardado con exito.", variant: "success" });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Informacion basica */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del club</CardTitle>
          <CardDescription>Datos basicos visibles en el portal publico.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del club</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <textarea
              id="description"
              {...form.register('description')}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe brevemente tu club..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" type="tel" placeholder="+34 600 000 000" {...form.register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email de contacto</Label>
              <Input id="email" type="email" placeholder="info@miclub.com" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openingTime">Hora de apertura</Label>
              <Input id="openingTime" type="time" {...form.register('openingTime')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closingTime">Hora de cierre</Label>
              <Input id="closingTime" type="time" {...form.register('closingTime')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuracion de reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas</CardTitle>
          <CardDescription>Configura las reglas de reservas para jugadores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxAdvanceBooking">Dias de antelacion maxima</Label>
              <Input
                id="maxAdvanceBooking"
                type="number"
                min={1}
                max={90}
                {...form.register('maxAdvanceBooking')}
              />
              <p className="text-xs text-muted-foreground">
                Cuantos dias antes puede un jugador reservar.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancellationHours">Horas para cancelar</Label>
              <Input
                id="cancellationHours"
                type="number"
                min={0}
                max={72}
                {...form.register('cancellationHours')}
              />
              <p className="text-xs text-muted-foreground">
                Horas antes de la reserva para permitir cancelacion.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Reservas de jugadores</Label>
                <p className="text-xs text-muted-foreground">
                  Permitir que los jugadores reserven pistas desde el portal.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.watch('enablePlayerBooking')}
                  onChange={(e) => form.setValue('enablePlayerBooking', e.target.checked)}
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Partidas abiertas</Label>
                <p className="text-xs text-muted-foreground">
                  Permitir crear y unirse a partidas abiertas.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.watch('enableOpenMatches')}
                  onChange={(e) => form.setValue('enableOpenMatches', e.target.checked)}
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="bookingPaymentMode">Modo de pago de reservas</Label>
            <select
              id="bookingPaymentMode"
              {...form.register('bookingPaymentMode')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="presential">Solo presencial (pago en club)</option>
              <option value="online">Solo online (Stripe)</option>
              <option value="both">Ambos (jugador elige)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Como cobran las reservas a los jugadores.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Boton guardar */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar ajustes
        </Button>
      </div>
    </form>
  );
};

export default SettingsForm;
