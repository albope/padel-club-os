import Link from 'next/link';
import { Zap } from 'lucide-react';
import AuthForm from '@/components/auth/AuthForm';
import AuthBrandingPanel from '@/components/auth/AuthBrandingPanel';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex bg-background">

      {/* Panel izquierdo: branding (solo desktop) */}
      <AuthBrandingPanel modo="login" />

      {/* Panel derecho: formulario */}
      <div className="flex flex-1 flex-col min-h-screen relative overflow-hidden">

        {/* Fondo del panel de formulario — patron de puntos muy sutil */}
        <div aria-hidden="true" className="absolute inset-0 auth-dot-pattern opacity-40" />

        {/* Orbe de profundidad superior */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 65%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 65%)',
          }}
        />

        {/* Logo mobile — visible solo en movil */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Padel Club OS
            </span>
          </Link>
        </div>

        {/* Contenido centrado */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 lg:px-14">
          <div className="w-full max-w-md auth-fade-in">
            <AuthForm isRegister={false} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
