'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const RegisterSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  email: z.string().min(1, 'El email es requerido.').email('Email invalido.'),
  password: z
    .string()
    .min(1, 'La contrasena es requerida.')
    .min(8, 'Minimo 8 caracteres.'),
  phone: z.string().optional(),
});

function evaluarPassword(password: string) {
  if (!password) return { score: 0, label: '', color: 'bg-border', width: 'w-0' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const nivel = Math.min(4, Math.max(1, score));
  const mapa: Record<number, { label: string; color: string; width: string }> = {
    1: { label: 'Muy debil', color: 'bg-red-500', width: 'w-1/4' },
    2: { label: 'Debil', color: 'bg-orange-400', width: 'w-2/4' },
    3: { label: 'Buena', color: 'bg-yellow-400', width: 'w-3/4' },
    4: { label: 'Fuerte', color: 'bg-emerald-500', width: 'w-full' },
  };
  return { score: nivel, ...mapa[nivel] };
}

export default function ClubRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const fortaleza = useMemo(() => evaluarPassword(passwordValue), [passwordValue]);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '', password: '', phone: '' },
  });

  const onSubmit = async (values: z.infer<typeof RegisterSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/register/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, slug }),
      });

      if (response.ok) {
        router.push(`/club/${slug}/login`);
      } else {
        const data = await response.json();
        setError(data.error || 'Error en el registro.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registrate como jugador del club
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                {...form.register('name')}
                placeholder="Tu nombre"
                className={cn(form.formState.errors.name && 'border-destructive')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="tu@email.com"
                className={cn(form.formState.errors.email && 'border-destructive')}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register('phone')}
                placeholder="600 123 456"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contrasena</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password', {
                    onChange: (e) => setPasswordValue(e.target.value),
                  })}
                  placeholder="Min. 8 caracteres"
                  className={cn('pr-10', form.formState.errors.password && 'border-destructive')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
              {passwordValue.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', fortaleza.color, fortaleza.width)} />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">{fortaleza.label}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando cuenta...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Crear cuenta</>
              )}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Ya tienes cuenta?{' '}
              <Link
                href={`/club/${slug}/login`}
                className="font-semibold text-primary hover:underline"
              >
                Inicia sesion
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
