import Link from 'next/link';
import { Zap } from 'lucide-react';
import AuthForm from '@/components/auth/AuthForm';
import AuthBrandingPanel from '@/components/auth/AuthBrandingPanel';

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-background">

      {/* Panel izquierdo: branding (solo desktop) */}
      <AuthBrandingPanel modo="registro" />

      {/* Panel derecho: formulario */}
      <div className="flex flex-1 flex-col min-h-screen relative overflow-hidden bg-white dark:bg-background">

        {/* Patron de puntos muy sutil — azul */}
        <div aria-hidden="true" className="absolute inset-0 auth-dot-pattern opacity-60" />

        {/* Orbe de profundidad superior derecha */}
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

        {/* Logo mobile — visible solo en movil */}
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
            <AuthForm isRegister={true} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
