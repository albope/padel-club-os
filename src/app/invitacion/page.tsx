'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface InvitationInfo {
  valid: boolean;
  clubName?: string;
  role?: string;
  email?: string;
  requiresPassword?: boolean;
  existingName?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  segmentColor: string;
}

function evaluarPassword(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '', segmentColor: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const nivel = Math.min(4, Math.max(1, score));

  const mapa: Record<number, Omit<PasswordStrength, 'score'>> = {
    1: { label: 'Muy debil', segmentColor: 'bg-red-500' },
    2: { label: 'Debil', segmentColor: 'bg-orange-400' },
    3: { label: 'Buena', segmentColor: 'bg-amber-400' },
    4: { label: 'Fuerte', segmentColor: 'bg-emerald-500' },
  };

  return { score: nivel, ...mapa[nivel] };
}

function InvitacionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const fortaleza = useMemo(() => evaluarPassword(passwordValue), [passwordValue]);

  const AcceptSchema = useMemo(() => {
    const base = z.object({
      name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.').max(100),
    });

    if (info?.requiresPassword) {
      return base.extend({
        password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.').max(128),
        confirmPassword: z.string().min(1, 'Confirma tu contrasena.'),
      }).refine((data) => data.password === data.confirmPassword, {
        message: 'Las contrasenas no coinciden.',
        path: ['confirmPassword'],
      });
    }

    return base;
  }, [info?.requiresPassword]);

  const form = useForm({
    resolver: zodResolver(AcceptSchema),
    defaultValues: { name: '', password: '', confirmPassword: '' },
  });

  // Validar token al montar
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`/api/team/accept?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        setInfo(data);
        if (data.existingName) {
          form.setValue('name', data.existingName);
        }
      })
      .catch(() => {
        setInfo({ valid: false });
      })
      .finally(() => setLoading(false));
  }, [token, form]);

  const onSubmit = async (values: Record<string, string>) => {
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, string> = { token, name: values.name };
      if (info?.requiresPassword && values.password) {
        body.password = values.password;
      }

      const res = await fetch('/api/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setExito(true);
      } else {
        setError(data.error || 'Error al aceptar la invitacion.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cargando
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Validando invitacion...
      </div>
    );
  }

  // Sin token o token invalido
  if (!token || !info?.valid) {
    return (
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Invitacion no valida</h2>
        <p className="text-sm text-muted-foreground">
          La invitacion no es valida o ha expirado. Contacta con el administrador de tu club para que te envie una nueva.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Ir a iniciar sesion
        </Link>
      </div>
    );
  }

  // Exito
  if (exito) {
    return (
      <div className="w-full max-w-md">
        <div className="auth-card-surface rounded-2xl p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">
              Bienvenido al equipo
            </h2>
            <p className="text-sm text-muted-foreground">
              Ya formas parte del equipo de <span className="font-semibold text-foreground">{info.clubName}</span> como {info.role}. Inicia sesion para acceder al panel de administracion.
            </p>
            <Link
              href="/login"
              className={cn(
                'inline-flex items-center justify-center gap-2 w-full h-10 rounded-lg',
                'text-sm font-semibold text-white auth-solid-btn'
              )}
            >
              Iniciar sesion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de aceptacion
  return (
    <div className="w-full max-w-md">
      <div className="auth-card-surface rounded-2xl p-8">
        <div className="mb-7">
          <h2 className="text-[22px] font-bold tracking-tight text-foreground">
            Aceptar invitacion
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Has sido invitado a unirte al equipo de <span className="font-semibold text-foreground">{info.clubName}</span> como <span className="font-semibold text-foreground">{info.role}</span>.
          </p>
        </div>

        {/* Info del email */}
        <div className="mb-5 rounded-lg bg-muted/50 border border-border/50 px-4 py-3">
          <p className="text-xs text-muted-foreground">Email de la invitacion</p>
          <p className="text-sm font-medium text-foreground">{info.email}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[13px] font-medium text-foreground/80">
              Nombre completo
            </Label>
            <div className="auth-input-glow rounded-lg">
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Tu nombre"
                autoComplete="name"
                className={cn(
                  'h-10 text-sm',
                  'bg-muted/40 border-border/70',
                  'focus-visible:ring-primary/20 focus-visible:border-primary/50',
                  'placeholder:text-muted-foreground/50 transition-all duration-150',
                  form.formState.errors.name &&
                    'border-destructive/50 bg-destructive/[0.03] focus-visible:ring-destructive/20'
                )}
              />
            </div>
            {form.formState.errors.name && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {form.formState.errors.name.message as string}
              </p>
            )}
          </div>

          {/* Password (solo si requiresPassword) */}
          {info.requiresPassword && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-medium text-foreground/80">
                  Contrasena
                </Label>
                <div className="auth-input-glow rounded-lg">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...form.register('password', {
                        onChange: (e) => setPasswordValue(e.target.value),
                      })}
                      placeholder="Min. 8 caracteres"
                      autoComplete="new-password"
                      className={cn(
                        'h-10 pr-10 text-sm',
                        'bg-muted/40 border-border/70',
                        'focus-visible:ring-primary/20 focus-visible:border-primary/50',
                        'placeholder:text-muted-foreground/50 transition-all duration-150',
                        form.formState.errors.password &&
                          'border-destructive/50 bg-destructive/[0.03] focus-visible:ring-destructive/20'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn(
                        'absolute inset-y-0 right-0 flex items-center px-3',
                        'text-muted-foreground/50 hover:text-foreground',
                        'transition-colors duration-150 focus-visible:outline-none'
                      )}
                      aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {form.formState.errors.password && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {form.formState.errors.password.message as string}
                  </p>
                )}

                {/* Indicador fortaleza */}
                {passwordValue.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((segmento) => (
                        <div
                          key={segmento}
                          className={cn(
                            'flex-1 h-1 rounded-full',
                            fortaleza.score >= segmento ? fortaleza.segmentColor : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">Seguridad de la contrasena</p>
                      <p
                        className={cn(
                          'text-[11px] font-semibold',
                          fortaleza.score === 1 && 'text-red-500',
                          fortaleza.score === 2 && 'text-orange-400',
                          fortaleza.score === 3 && 'text-amber-500',
                          fortaleza.score === 4 && 'text-emerald-500'
                        )}
                        aria-live="polite"
                      >
                        {fortaleza.label}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar contrasena */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-[13px] font-medium text-foreground/80">
                  Confirmar contrasena
                </Label>
                <div className="auth-input-glow rounded-lg">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    {...form.register('confirmPassword')}
                    placeholder="Repite tu contrasena"
                    autoComplete="new-password"
                    className={cn(
                      'h-10 text-sm',
                      'bg-muted/40 border-border/70',
                      'focus-visible:ring-primary/20 focus-visible:border-primary/50',
                      'placeholder:text-muted-foreground/50 transition-all duration-150',
                      form.formState.errors.confirmPassword &&
                        'border-destructive/50 bg-destructive/[0.03] focus-visible:ring-destructive/20'
                    )}
                  />
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {form.formState.errors.confirmPassword.message as string}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Error global */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-destructive/[0.07] border border-destructive/15">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive leading-snug">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              'relative w-full h-10 rounded-lg text-sm font-semibold',
              'text-white overflow-hidden',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-55 disabled:pointer-events-none',
              'auth-solid-btn'
            )}
          >
            <span className="relative flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Aceptando...
                </>
              ) : info.requiresPassword ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Crear cuenta y aceptar
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Aceptar invitacion
                </>
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function InvitacionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50 dark:bg-background">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando...
          </div>
        }
      >
        <InvitacionContent />
      </Suspense>
    </div>
  );
}
