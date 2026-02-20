import Link from 'next/link';
import {
  CalendarCheck2,
  Trophy,
  BarChart3,
  Shield,
  Star,
  CheckCircle,
  Zap,
} from 'lucide-react';

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface AuthBrandingPanelProps {
  modo: 'registro' | 'login';
}

/* ─── Datos ──────────────────────────────────────────────────────────────── */

const beneficios = [
  {
    icono: CalendarCheck2,
    titulo: 'Reservas en tiempo real',
    descripcion: 'Tus socios reservan pistas 24/7 desde cualquier dispositivo.',
  },
  {
    icono: Trophy,
    titulo: 'Ligas y torneos',
    descripcion: 'Competiciones con cuadros y clasificaciones automaticas.',
  },
  {
    icono: BarChart3,
    titulo: 'Analiticas del club',
    descripcion: 'Ocupacion, ingresos y actividad en tiempo real.',
  },
  {
    icono: Shield,
    titulo: 'Multi-rol y seguro',
    descripcion: 'Admins, staff y socios con permisos diferenciados.',
  },
];

const garantias = ['Sin permanencia', 'Soporte 24/7', 'RGPD compliant'];

/* ─── Componente ─────────────────────────────────────────────────────────── */

export default function AuthBrandingPanel({ modo }: AuthBrandingPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden flex-col">

      {/* Fondo con gradient animado — claro y luminoso */}
      <div className="absolute inset-0 auth-gradient-bg" />

      {/* Capa de ruido/textura muy sutil para dar profundidad */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Grid de puntos sutil — azul muy tenue */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(32,106,245,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Orbes de luz suave — azul/cyan */}
      <div
        aria-hidden="true"
        className="auth-orb auth-float-1 w-[480px] h-[480px] -top-24 -right-28"
        style={{ background: 'radial-gradient(circle, rgba(107,188,226,0.38) 0%, transparent 60%)' }}
      />
      <div
        aria-hidden="true"
        className="auth-orb auth-float-2 w-[380px] h-[380px] -bottom-20 -left-20"
        style={{ background: 'radial-gradient(circle, rgba(32,106,245,0.22) 0%, transparent 60%)' }}
      />
      <div
        aria-hidden="true"
        className="auth-orb auth-float-3 w-[260px] h-[260px] top-[42%] left-[28%]"
        style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.28) 0%, transparent 60%)' }}
      />

      {/* Formas geometricas decorativas — tonos azul claros */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-10 right-14 w-16 h-16 rounded-2xl auth-float-2"
          style={{
            border: '1px solid rgba(32,106,245,0.12)',
            background: 'rgba(32,106,245,0.05)',
            transform: 'rotate(12deg)',
          }}
        />
        <div
          className="absolute bottom-24 right-16 w-10 h-10 rounded-xl auth-float-1"
          style={{
            border: '1px solid rgba(107,188,226,0.16)',
            background: 'rgba(107,188,226,0.06)',
            transform: 'rotate(-6deg)',
          }}
        />
        <div
          className="absolute top-[36%] left-8 w-7 h-7 rounded-lg auth-float-3"
          style={{
            border: '1px solid rgba(32,106,245,0.14)',
            background: 'rgba(32,106,245,0.06)',
            transform: 'rotate(45deg)',
          }}
        />
        {/* Linea de acento diagonal */}
        <div
          className="absolute -top-1/4 -right-1/4 w-[150%] h-px rotate-[-18deg]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(32,106,245,0.10), transparent)' }}
        />
        <div
          className="absolute top-2/3 -left-1/4 w-[150%] h-px rotate-[-18deg]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(107,188,226,0.08), transparent)' }}
        />
      </div>

      {/* Contenido principal del panel */}
      <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

        {/* Logo — texto oscuro sobre fondo claro */}
        <div className="auth-fade-up-1">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200"
              style={{
                background: 'rgba(32,106,245,0.12)',
                border: '1px solid rgba(32,106,245,0.18)',
              }}
            >
              <Zap className="w-[18px] h-[18px]" style={{ color: 'hsl(217,91%,50%)' }} />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Padel Club OS
            </span>
          </Link>
        </div>

        {/* Contenido central — empujado al fondo */}
        <div className="mt-auto">

          {/* Badge de modo */}
          <div className="auth-fade-up-2 mb-6">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
              style={{
                background: 'rgba(32,106,245,0.09)',
                border: '1px solid rgba(32,106,245,0.16)',
                color: 'hsl(217,75%,45%)',
              }}
            >
              <Star className="w-3 h-3 flex-shrink-0" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
              {modo === 'registro' ? '14 dias de prueba gratuita' : 'La plataforma lider en Espana'}
            </span>
          </div>

          {/* Titular principal — texto oscuro */}
          <h1
            className="auth-fade-up-2 font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-slate-50"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
          >
            {modo === 'registro' ? (
              <>
                La plataforma que{' '}
                <span
                  style={{
                    background: 'linear-gradient(92deg, hsl(217,91%,50%) 0%, hsl(197,85%,48%) 55%, hsl(180,75%,45%) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'block',
                  }}
                >
                  tu club necesita
                </span>
              </>
            ) : (
              <>
                Tu club, siempre{' '}
                <span
                  style={{
                    background: 'linear-gradient(92deg, hsl(217,91%,50%) 0%, hsl(197,85%,48%) 55%, hsl(180,75%,45%) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'block',
                  }}
                >
                  bajo control
                </span>
              </>
            )}
          </h1>

          <p className="auth-fade-up-3 mt-4 text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
            {modo === 'registro'
              ? 'Digitaliza tu club en minutos. Reservas, socios, torneos y analiticas en un solo lugar.'
              : 'Accede a tu panel de gestion y mantente al dia con todo lo que ocurre en tu club.'}
          </p>

          {/* Lista de beneficios */}
          <div className="mt-8 space-y-3">
            {beneficios.map((item, i) => {
              const Icono = item.icono;
              return (
                <div
                  key={item.titulo}
                  className="auth-slide-right flex items-start gap-3.5"
                  style={{ animationDelay: `${0.28 + i * 0.07}s` }}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                    style={{
                      background: 'rgba(32,106,245,0.09)',
                      border: '1px solid rgba(32,106,245,0.14)',
                    }}
                  >
                    <Icono className="w-3.5 h-3.5" style={{ color: 'hsl(217,75%,50%)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      {item.titulo}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.descripcion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Separador */}
          <div
            className="auth-fade-up-6 mt-10"
            style={{ borderTop: '1px solid rgba(32,106,245,0.10)' }}
          />

          {/* Social proof */}
          <div className="auth-fade-up-6 mt-6">
            <div className="flex items-start gap-4">
              {/* Avatares */}
              <div className="flex -space-x-2 flex-shrink-0 mt-0.5">
                {[
                  { bg: 'hsl(217,80%,52%)', letra: 'J' },
                  { bg: 'hsl(197,75%,46%)', letra: 'M' },
                  { bg: 'hsl(170,65%,42%)', letra: 'A' },
                  { bg: 'hsl(235,70%,58%)', letra: 'R' },
                ].map(({ bg, letra }, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      background: bg,
                      border: '2px solid rgba(255,255,255,0.85)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    }}
                  >
                    {letra}
                  </div>
                ))}
              </div>

              {/* Texto y estrellas */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                  ))}
                  <span className="ml-1 text-xs font-semibold text-slate-600 dark:text-slate-300">5.0</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">+500 clubes</span>{' '}
                  confian en Padel Club OS
                </p>
              </div>
            </div>

            {/* Testimonial card — blanco sobre el fondo azul claro */}
            <div
              className="mt-4 rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.82)',
                border: '1px solid rgba(32,106,245,0.10)',
                boxShadow: '0 2px 12px rgba(32,106,245,0.08), 0 1px 3px rgba(0,0,0,0.06)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p className="text-sm text-slate-600 leading-relaxed">
                &ldquo;Pasamos de hojas de calculo a tener todo automatizado en menos de una semana.
                Las reservas aumentaron un{' '}
                <span className="text-slate-800 font-medium">40%</span> el primer mes.&rdquo;
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: 'hsl(217,80%,52%)',
                    }}
                  >
                    <span className="text-[9px] font-bold text-white">JM</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Jorge Morales</p>
                    <p className="text-[11px] text-slate-400">Director, Club Padel Valencia</p>
                  </div>
                </div>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(32,106,245,0.08)' }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 7.5L7.5 1.5M7.5 1.5H2.5M7.5 1.5V6.5" stroke="hsl(217,75%,50%)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Garantias */}
          <div className="auth-fade-up-6 mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {garantias.map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: 'hsl(150,65%,42%)' }}
                />
                <span>{item}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
