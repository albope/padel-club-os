import Link from 'next/link';
import AuthForm from '@/components/auth/AuthForm';
import AuthBrandingPanel from '@/components/auth/AuthBrandingPanel';
import { LogoIcon } from '@/components/ui/logo-icon';

const LoginPage = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AuthBrandingPanel modo="login" />

      <main className="relative flex min-h-screen flex-1 flex-col bg-background">
        <div className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <LogoIcon tamano="md" className="text-foreground" />
            <span className="font-display text-base font-bold tracking-tight text-foreground">
              PadelClub OS
            </span>
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:px-12">
          <div className="w-full max-w-md">
            <AuthForm isRegister={false} />
          </div>
        </div>

        <p className="px-6 pb-6 text-center text-xs text-muted-foreground">
          PadelClub OS · Software de gestión para clubes de pádel
        </p>
      </main>
    </div>
  );
};

export default LoginPage;
