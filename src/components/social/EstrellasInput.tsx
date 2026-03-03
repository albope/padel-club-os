'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EstrellasInputProps {
  value: number;
  onChange: (stars: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function EstrellasInput({ value, onChange, size = 'md' }: EstrellasInputProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const dimensiones = size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-6 w-6' : 'h-4 w-4';

  const valorMostrado = hoverValue || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Valoracion">
      {[1, 2, 3, 4, 5].map((estrella) => (
        <button
          key={estrella}
          type="button"
          role="radio"
          aria-checked={value === estrella}
          aria-label={`${estrella} estrella${estrella !== 1 ? 's' : ''}`}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          onClick={() => onChange(estrella)}
          onMouseEnter={() => setHoverValue(estrella)}
          onMouseLeave={() => setHoverValue(0)}
        >
          <Star
            className={cn(
              dimensiones,
              'transition-colors',
              estrella <= valorMostrado
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}
