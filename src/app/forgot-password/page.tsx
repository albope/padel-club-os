'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Zap, Loader2, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import AuthBrandingPanel from '@/components/auth/AuthBrandingPanel';

const ForgotPasswordSchema = z.object({
  email: z.string().min(1, 'El email es requerido.').email('Email invalido.'),
});

export default function ForgotPasswordPage() {
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
        body: JSON.stringify({ ...values, redirectUrl: '/login' }),
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-background">

      {/* Panel izquierdo: branding (solo desktop) */}
      <AuthBrandingPanel modo="login" />

      {/* Panel derecho: formulario */}
      <div className="flex flex-1 flex-col min-h-screen relative overflow-hidden bg-white dark:bg-background">

        {/* Patron de puntos sutil */}
        <div aria-hidden="true" className="absolute inset-0 auth-dot-pattern opacity-60" />

        {/* Orbe superior derecha */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-1/3 -right-1/4 w-[560px] h-[560px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(217 91% 60% / 0.06) 0%, transparent 65%)',
          }}
        />
        {/* Orbe inferior izquierda */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1/4 -left-1/4 w-[380px] h-[380px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(197 85% 55% / 0.05) 0%, transparent 65%)',
          }}
        />

        {/* Logo mobile */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(32,106,245,0.1)',
                border: '1px solid rgba(32,106,245,0.16)',
              }}
            >
              <Zap className="w-4 h-4" style={{ color: 'hsl(217,91%,50%)' }} />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-foreground">
              Padel Club OS
            </span>
          </Link>
        </div>

        {/* Contenido centrado */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 lg:px-14">
          <div className="w-full max-w-md auth-fade-in">
            <div className="auth-card-surface rounded-2xl p-8 w-full max-w-md auth-scale-in">
              {enviado ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h2 className="text-[22px] font-bold tracking-tight text-foreground">
                    Revisa tu correo
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Si el email esta registrado, recibiras instrucciones para restablecer tu contrasena.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a iniciar sesion
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-7">
                    <h2 className="text-[22px] font-bold tracking-tight text-foreground">
                      Recuperar contrasena
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Introduce tu email y te enviaremos instrucciones.
                    </p>
                  </div>

                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[13px] font-medium text-foreground/80">
                        Correo electronico
                      </Label>
                      <div className="auth-input-glow rounded-lg">
                        <Input
                          id="email"
                          type="email"
                          {...form.register('email')}
                          placeholder="tu@club.com"
                          autoComplete="email"
                          className={cn(
                            'h-10 text-sm',
                            'bg-muted/40 border-border/70',
                            'focus-visible:ring-primary/20 focus-visible:border-primary/50',
                            'placeholder:text-muted-foreground/50 transition-all duration-150',
                            form.formState.errors.email &&
                              'border-destructive/50 bg-destructive/[0.03] focus-visible:ring-destructive/20'
                          )}
                        />
                      </div>
                      {form.formState.errors.email && (
                        <p className="flex items-center gap-1.5 text-xs text-destructive">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    {error && (
                      <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-destructive/[0.07] border border-destructive/15">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-destructive leading-snug">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        'relative w-full h-10 rounded-lg text-sm font-semibold',
                        'text-white overflow-hidden',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        'disabled:opacity-55 disabled:pointer-events-none',
                        'auth-solid-btn'
                      )}
                    >
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4" />
                            Enviar instrucciones
                          </>
                        )}
                      </span>
                    </button>
                  </form>

                  <div className="mt-6 pt-5 border-t border-border/60 text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver a iniciar sesion
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
