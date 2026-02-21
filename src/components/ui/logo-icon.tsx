import { cn } from '@/lib/utils';

const tamanos = {
  sm: { contenedor: 'w-7 h-7', svg: 14 },
  md: { contenedor: 'w-8 h-8', svg: 16 },
  lg: { contenedor: 'w-9 h-9', svg: 18 },
} as const;

interface LogoIconProps {
  tamano?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LogoIcon({ tamano = 'md', className }: LogoIconProps) {
  const config = tamanos[tamano];

  return (
    <div
      className={cn(
        config.contenedor,
        'rounded-xl flex items-center justify-center flex-shrink-0',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, hsl(217,91%,52%) 0%, hsl(197,85%,48%) 100%)',
      }}
    >
      <svg
        width={config.svg}
        height={config.svg}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        {/* Pista exterior */}
        <rect
          x="4" y="2" width="16" height="20" rx="1.5"
          stroke="white" strokeWidth="1.5" opacity="0.95"
        />
        {/* Red central */}
        <line
          x1="4" y1="12" x2="20" y2="12"
          stroke="white" strokeWidth="1.5" opacity="0.95"
        />
        {/* Servicio superior */}
        <line
          x1="12" y1="2" x2="12" y2="12"
          stroke="white" strokeWidth="1" opacity="0.45"
        />
        <line
          x1="4" y1="7.5" x2="20" y2="7.5"
          stroke="white" strokeWidth="1" opacity="0.35"
        />
        {/* Servicio inferior */}
        <line
          x1="12" y1="12" x2="12" y2="22"
          stroke="white" strokeWidth="1" opacity="0.45"
        />
        <line
          x1="4" y1="16.5" x2="20" y2="16.5"
          stroke="white" strokeWidth="1" opacity="0.35"
        />
      </svg>
    </div>
  );
}
