'use client';

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { upload } from '@vercel/blob/client';
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
  primaryColor: z.string().optional(),
  bannerUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  maxAdvanceBooking: z.coerce.number().int().min(1).max(90).optional(),
  cancellationHours: z.coerce.number().int().min(0).max(72).optional(),
  bookingDuration: z.coerce.number().int().optional(),
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      name: club.name || '',
      openingTime: club.openingTime || '09:00',
      closingTime: club.closingTime || '23:00',
      description: club.description || '',
      phone: club.phone || '',
      email: club.email || '',
      primaryColor: club.primaryColor || '#4f46e5',
      bannerUrl: club.bannerUrl || '',
      instagramUrl: club.instagramUrl || '',
      facebookUrl: club.facebookUrl || '',
      maxAdvanceBooking: club.maxAdvanceBooking ?? 7,
      cancellationHours: club.cancellationHours ?? 2,
      bookingDuration: club.bookingDuration ?? 90,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Solo se permiten imagenes (JPG, PNG, WebP, GIF).", variant: "destructive" })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "La imagen no puede superar 5MB.", variant: "destructive" })
      return
    }

    setIsUploading(true)
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      })
      form.setValue("bannerUrl", blob.url)
      toast({ title: "Imagen subida", description: "Recuerda guardar los ajustes para aplicar el cambio.", variant: "success" })
    } catch (err: any) {
      toast({ title: "Error al subir imagen", description: err.message, variant: "destructive" })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const bannerUrl = form.watch("bannerUrl")

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

      {/* Apariencia del portal */}
      <Card>
        <CardHeader>
          <CardTitle>Apariencia del portal</CardTitle>
          <CardDescription>Personaliza la imagen de tu club en el portal de jugadores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Color principal</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="primaryColor"
                value={form.watch('primaryColor') || '#4f46e5'}
                onChange={(e) => form.setValue('primaryColor', e.target.value)}
                className="h-10 w-14 rounded-md border border-input cursor-pointer"
              />
              <Input
                value={form.watch('primaryColor') || '#4f46e5'}
                onChange={(e) => form.setValue('primaryColor', e.target.value)}
                className="flex-1 max-w-[200px]"
                placeholder="#4f46e5"
              />
              <p className="text-xs text-muted-foreground ml-2">
                Color corporativo que se aplica en el portal.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Imagen de portada</Label>
            <p className="text-xs text-muted-foreground">
              Se muestra como banner en la pagina principal del portal. Recomendado: 1200x400px, JPG o PNG.
            </p>
            {bannerUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-input">
                <img
                  src={bannerUrl}
                  alt="Portada del club"
                  className="w-full h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => form.setValue("bannerUrl", "")}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                  <p className="text-sm">Sin imagen de portada</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Subiendo..." : bannerUrl ? "Cambiar imagen" : "Subir imagen"}
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                type="url"
                placeholder="https://instagram.com/tuclub"
                {...form.register('instagramUrl')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook</Label>
              <Input
                id="facebookUrl"
                type="url"
                placeholder="https://facebook.com/tuclub"
                {...form.register('facebookUrl')}
              />
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
            <Label htmlFor="bookingDuration">Duracion de reserva</Label>
            <select
              id="bookingDuration"
              value={form.watch('bookingDuration')}
              onChange={(e) => form.setValue('bookingDuration', Number(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value={60}>60 minutos</option>
              <option value={90}>90 minutos</option>
              <option value={120}>120 minutos</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Duracion predeterminada de cada reserva de pista.
            </p>
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
