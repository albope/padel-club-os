'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const IDIOMAS = [
  { codigo: 'es', nombre: 'Español', bandera: '🇪🇸' },
  { codigo: 'en', nombre: 'English', bandera: '🇬🇧' },
] as const;

interface LanguageSelectorProps {
  variante?: 'icon' | 'text';
  className?: string;
}

export function LanguageSelector({ variante = 'icon', className }: LanguageSelectorProps) {
  const locale = useLocale();
  const router = useRouter();

  const cambiarIdioma = async (nuevoLocale: string) => {
    if (nuevoLocale === locale) return;
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: nuevoLocale }),
    });
    router.refresh();
  };

  const idiomaActual = IDIOMAS.find(i => i.codigo === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variante === 'icon' ? 'icon' : 'sm'}
          className={cn('h-11 w-11', variante === 'text' && 'w-auto px-2', className)}
          aria-label={`Idioma: ${idiomaActual?.nombre}`}
        >
          {variante === 'icon' ? (
            <Globe className="h-5 w-5" />
          ) : (
            <span className="flex items-center gap-1.5 text-sm">
              {idiomaActual?.bandera} {idiomaActual?.codigo.toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {IDIOMAS.map((idioma) => (
          <DropdownMenuItem
            key={idioma.codigo}
            onClick={() => cambiarIdioma(idioma.codigo)}
            className={cn(locale === idioma.codigo && 'bg-accent')}
          >
            <span className="mr-2">{idioma.bandera}</span>
            {idioma.nombre}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
