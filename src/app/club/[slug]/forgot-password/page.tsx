'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ForgotPasswordSchema = z.object({
  email: z.string().min(1, 'El email es requerido.').email('Email inválido.'),
});

export default function ClubForgotPasswordPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: z.infer<typeof ForgotPasswordSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, redirectUrl: `/club/${slug}/login` }),
      });

      if (response.ok) {
        setEnviado(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al procesar la solicitud.');
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
          <CardTitle className="text-2xl font-bold">
            {enviado ? 'Revisa tu correo' : 'Recuperar contraseña'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {enviado
              ? 'Si el email está registrado, recibirás instrucciones.'
              : 'Introduce tu email y te enviaremos instrucciones.'}
          </p>
        </CardHeader>
        <CardContent>
          {enviado ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Mail className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Revisa tu bandeja de entrada (y la carpeta de spam).
              </p>
              <Link
                href={`/club/${slug}/login`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    className={cn(form.formState.errors.email && 'border-destructive')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
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
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar instrucciones
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t text-center">
                <Link
                  href={`/club/${slug}/login`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a iniciar sesión
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
