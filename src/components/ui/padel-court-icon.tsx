import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PadelCourtIconProps extends React.SVGProps<SVGSVGElement> {
  strokeWidth?: number;
}

/**
 * Pista de pádel vista desde arriba.
 * Mantiene el lenguaje de línea de Lucide, pero evita confundirla con una valla.
 */
export const PadelCourtIcon = React.forwardRef<SVGSVGElement, PadelCourtIconProps>(
  ({ className, strokeWidth = 1.75, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      aria-hidden="true"
      {...props}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M5 12h14" />
      <path d="M5 7.5h14M5 16.5h14" opacity="0.72" />
      <path d="M12 7.5V12M12 12v4.5" opacity="0.72" />
      <path d="M3.75 12h16.5" />
    </svg>
  ),
);

PadelCourtIcon.displayName = 'PadelCourtIcon';
