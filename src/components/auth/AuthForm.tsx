'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/* ─── Validacion ─────────────────────────────────────────────────────────── */

const FormSchema = z.object({
  email: z.string().min(1, 'El email es requerido.').email('Email invalido.'),
  password: z
    .string()
    .min(1, 'La contrasena es requerida.')
    .min(8, 'La contrasena debe tener al menos 8 caracteres.'),
  name: z.string().optional(),
});

/* ─── Password strength ──────────────────────────────────────────────────── */

interface PasswordStrength {
  score: number;    // 0–4
  label: string;
  segmentColor: string;
}

function evaluarPassword(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '', segmentColor: '' };

  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const nivel = Math.min(4, Math.max(1, score));

  const mapa: Record<number, Omit<PasswordStrength, 'score'>> = {
    1: { label: 'Muy debil',  segmentColor: 'bg-red-500' },
    2: { label: 'Debil',      segmentColor: 'bg-orange-400' },
    3: { label: 'Buena',      segmentColor: 'bg-amber-400' },
    4: { label: 'Fuerte',     segmentColor: 'bg-emerald-500' },
  };

  return { score: nivel, ...mapa[nivel] };
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface AuthFormProps {
  isRegister?: boolean;
}

/* ─── Componente ─────────────────────────────────────────────────────────── */

const AuthForm: React.FC<AuthFormProps> = ({ isRegister = false }) => {
  const router = useRouter();
  const [error, setError]                 = useState<string | null>(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  const fortaleza = useMemo(() => evaluarPassword(passwordValue), [passwordValue]);

  /* ─── Submit ────────────────────────────────────────────────────────────── */

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    setError(null);

    if (isRegister) {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (response.ok) {
          router.push('/login');
        } else {
          const data = await response.json();
          setError(data.message || 'Error en el registro.');
        }
      } catch {
        setError('No se pudo conectar con el servidor.');
      } finally {
        setIsLoading(false);
      }
    } else {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });
      setIsLoading(false);
      if (result?.error) {
        setError('Email o contrasena incorrectos.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    }
  };

  /* ─── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="auth-card-surface rounded-2xl p-8 w-full max-w-md auth-scale-in">

      {/* Cabecera del formulario */}
      <div className="mb-7">
        <h2 className="text-[22px] font-bold tracking-tight text-foreground">
          {isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isRegister
            ? 'Empieza gratis. Sin tarjeta de credito.'
            : 'Introduce tus credenciales para acceder.'}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Campo nombre (solo registro) */}
        {isRegister && (
          <div className="space-y-1.5 auth-fade-up-4">
            <Label htmlFor="name" className="text-[13px] font-medium text-foreground/80">
              Nombre completo
            </Label>
            <div className="auth-input-glow rounded-lg">
              <Input
                id="name"
                type="text"
                {...form.register('name')}
                placeholder="Tu nombre"
                className={cn(
                  'h-10 text-sm',
                  'bg-muted/40 border-border/70',
                  'focus-visible:ring-primary/20 focus-visible:border-primary/50',
                  'placeholder:text-muted-foreground/50 transition-all duration-150'
                )}
              />
            </div>
          </div>
        )}

        {/* Campo email */}
        <div className={cn('space-y-1.5', isRegister ? 'auth-fade-up-4' : 'auth-fade-up-3')}>
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

        {/* Campo contrasena */}
        <div className={cn('space-y-1.5', isRegister ? 'auth-fade-up-5' : 'auth-fade-up-4')}>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[13px] font-medium text-foreground/80">
              Contrasena
            </Label>
            {!isRegister && (
              <Link
                href="#"
                className="text-xs text-primary/70 hover:text-primary transition-colors duration-150"
              >
                Olvidaste tu contrasena?
              </Link>
            )}
          </div>

          <div className="auth-input-glow rounded-lg">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...form.register('password', {
                  onChange: (e) => setPasswordValue(e.target.value),
                })}
                placeholder={isRegister ? 'Min. 8 caracteres' : '••••••••'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
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
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye className="h-4 w-4" />
                }
              </button>
            </div>
          </div>

          {form.formState.errors.password && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {form.formState.errors.password.message}
            </p>
          )}

          {/* Indicador de fortaleza — 4 segmentos */}
          {isRegister && passwordValue.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((segmento) => (
                  <div
                    key={segmento}
                    className={cn(
                      'flex-1 h-1 rounded-full auth-strength-bar',
                      fortaleza.score >= segmento
                        ? fortaleza.segmentColor
                        : 'bg-muted'
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Seguridad de la contrasena</p>
                <p className={cn(
                  'text-[11px] font-semibold',
                  fortaleza.score === 1 && 'text-red-500',
                  fortaleza.score === 2 && 'text-orange-400',
                  fortaleza.score === 3 && 'text-amber-500',
                  fortaleza.score === 4 && 'text-emerald-500',
                )}>
                  {fortaleza.label}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error global */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-destructive/[0.07] border border-destructive/15 auth-fade-up-1">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive leading-snug">{error}</p>
          </div>
        )}

        {/* Terminos (solo registro) */}
        {isRegister && (
          <p className="auth-fade-up-5 text-[11px] text-muted-foreground leading-relaxed pt-0.5">
            Al registrarte aceptas nuestros{' '}
            <Link
              href="/terminos"
              className="text-foreground/60 hover:text-foreground underline-offset-2 hover:underline transition-colors"
            >
              Terminos de servicio
            </Link>{' '}
            y{' '}
            <Link
              href="/privacidad"
              className="text-foreground/60 hover:text-foreground underline-offset-2 hover:underline transition-colors"
            >
              Politica de privacidad
            </Link>.
          </p>
        )}

        {/* Boton submit */}
        <div className={cn(isRegister ? 'auth-fade-up-6' : 'auth-fade-up-5', 'pt-1')}>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'relative w-full h-10 rounded-lg text-sm font-semibold',
              'text-white overflow-hidden',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-55 disabled:pointer-events-none',
              'hover:scale-[1.015] active:scale-[0.985]',
              'shadow-sm hover:shadow-md',
              !isLoading && 'auth-shimmer-btn'
            )}
            style={isLoading ? { backgroundColor: 'hsl(var(--primary))' } : undefined}
          >
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{isRegister ? 'Creando cuenta...' : 'Entrando...'}</span>
                </>
              ) : (
                <>
                  {isRegister
                    ? <><CheckCircle2 className="h-4 w-4" /><span>Crear cuenta gratis</span></>
                    : <><span>Iniciar sesion</span><ArrowRight className="h-3.5 w-3.5" /></>
                  }
                </>
              )}
            </span>
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-border/60 text-center auth-fade-up-6">
        <p className="text-sm text-muted-foreground">
          {isRegister ? 'Ya tienes una cuenta?' : 'No tienes una cuenta?'}{' '}
          <Link
            href={isRegister ? '/login' : '/register'}
            className="font-semibold text-primary hover:text-primary/80 transition-colors duration-150 underline-offset-2 hover:underline"
          >
            {isRegister ? 'Inicia sesion' : 'Registrate gratis'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
