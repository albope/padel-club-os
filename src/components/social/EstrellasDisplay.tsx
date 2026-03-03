'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EstrellasDisplayProps {
  valor: number;
  total?: number;
  size?: 'sm' | 'md';
}

export function EstrellasDisplay({ valor, total, size = 'sm' }: EstrellasDisplayProps) {
  const dimensiones = size === 'md' ? 'h-4 w-4' : 'h-3 w-3';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((estrella) => (
        <Star
          key={estrella}
          className={cn(
            dimensiones,
            estrella <= Math.round(valor)
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-muted text-muted-foreground/30'
          )}
        />
      ))}
      {total !== undefined && (
        <span className="text-xs text-muted-foreground ml-1">
          ({total})
        </span>
      )}
    </div>
  );
}
