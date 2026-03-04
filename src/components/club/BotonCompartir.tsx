'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface DatosCompartir {
  titulo: string;
  texto: string;
  url: string;
}

interface CallbacksCompartir {
  onCopiado: () => void;
  onError: (url: string) => void;
}

/**
 * Logica de compartir standalone, usable desde componentes y ToastAction.
 * - Web Share API si existe
 * - AbortError (usuario cancela dialogo nativo) = silencio total
 * - Otro error o API no disponible = fallback clipboard
 * - Si clipboard falla = callback onError con URL para copia manual
 */
export async function compartir(
  datos: DatosCompartir,
  callbacks: CallbacksCompartir
) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: datos.titulo,
        text: datos.texto,
        url: datos.url,
      });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Otro error real → caer a clipboard
    }
  }

  const textoCompleto = `${datos.texto}\n\n${datos.url}`;
  try {
    await navigator.clipboard.writeText(textoCompleto);
    callbacks.onCopiado();
  } catch {
    callbacks.onError(datos.url);
  }
}

interface BotonCompartirProps {
  datos: DatosCompartir;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  mostrarTexto?: boolean;
}

export default function BotonCompartir({
  datos,
  variant = 'outline',
  size = 'sm',
  className,
  mostrarTexto = true,
}: BotonCompartirProps) {
  const t = useTranslations('share');

  const handleCompartir = () => {
    compartir(datos, {
      onCopiado: () => {
        toast({
          title: t('copiedTitle'),
          description: t('copiedDescription'),
          variant: 'success',
        });
      },
      onError: (url) => {
        toast({
          title: t('errorTitle'),
          description: t('errorDescription', { url }),
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleCompartir}
      aria-label={t('share')}
    >
      <Share2 className={cn('h-4 w-4', mostrarTexto && 'mr-1.5')} />
      {mostrarTexto && t('share')}
    </Button>
  );
}
