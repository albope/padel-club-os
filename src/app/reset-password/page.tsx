'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirma tu contrasena.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrasenas no coinciden.',
    path: ['confirmPassword'],
  });

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

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const redirect = searchParams.get('redirect') || '/login';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const fortaleza = useMemo(() => evaluarPassword(passwordValue), [passwordValue]);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: z.infer<typeof ResetPasswordSchema>) => {
    if (!token) {
      setError('Token no valido. Solicita un nuevo enlace.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: values.password }),
      });

      const data = await response.json();

      if (response.ok) {
        setExito(true);
      } else {
        setError(data.error || 'Error al restablecer la contrasena.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sin token en la URL
  if (!token) {
    return (
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Enlace no valido</h2>
        <p className="text-sm text-muted-foreground">
          El enlace de recuperacion no es valido o ha expirado.
        </p>
        <Link
          href={redirect}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesion
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="auth-card-surface rounded-2xl p-8">
        {exito ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">
              Contrasena actualizada
            </h2>
            <p className="text-sm text-muted-foreground">
              Tu contrasena ha sido restablecida correctamente. Ya puedes iniciar sesion.
            </p>
            <Link
              href={redirect}
              className={cn(
                'inline-flex items-center justify-center gap-2 w-full h-10 rounded-lg',
                'text-sm font-semibold text-white auth-solid-btn'
              )}
            >
              Iniciar sesion
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <h2 className="text-[22px] font-bold tracking-tight text-foreground">
                Nueva contrasena
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Introduce tu nueva contrasena.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Nueva contrasena */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-medium text-foreground/80">
                  Nueva contrasena
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
                    {form.formState.errors.password.message}
                  </p>
                )}

                {/* Indicador de fortaleza */}
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
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Error global */}
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
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Restablecer contrasena
                    </>
                  )}
                </span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
