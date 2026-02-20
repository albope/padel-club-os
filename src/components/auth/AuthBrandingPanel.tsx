import Link from 'next/link';
import {
  CalendarCheck2,
  Trophy,
  BarChart3,
  Shield,
  Star,
  CheckCircle,
  Zap,
  ArrowUpRight,
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

      {/* Fondo con gradient animado */}
      <div className="absolute inset-0 auth-gradient-bg" />

      {/* Capa de ruido/textura sutil */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Grid de puntos sutil */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Orbes de fondo — mas controlados y elegantes */}
      <div
        aria-hidden="true"
        className="auth-orb auth-float-1 w-[500px] h-[500px] -top-32 -right-32"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.55) 0%, transparent 65%)' }}
      />
      <div
        aria-hidden="true"
        className="auth-orb auth-float-2 w-[400px] h-[400px] -bottom-24 -left-24"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.45) 0%, transparent 65%)' }}
      />
      <div
        aria-hidden="true"
        className="auth-orb auth-float-3 w-[300px] h-[300px] top-[40%] left-[30%]"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 65%)' }}
      />

      {/* Lineas de acento — elemento grafico refinado */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Linea diagonal superior */}
        <div
          className="absolute -top-1/4 -right-1/4 w-[150%] h-px rotate-[-20deg]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
        />
        {/* Linea diagonal inferior */}
        <div
          className="absolute top-2/3 -left-1/4 w-[150%] h-px rotate-[-20deg]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
        />
        {/* Formas geometricas minimalistas */}
        <div
          className="absolute top-12 right-12 w-20 h-20 rounded-2xl auth-float-2"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            transform: 'rotate(15deg)',
          }}
        />
        <div
          className="absolute bottom-28 right-20 w-12 h-12 rounded-xl auth-float-1"
          style={{
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
            transform: 'rotate(-8deg)',
          }}
        />
        <div
          className="absolute top-[38%] left-10 w-8 h-8 rounded-lg auth-float-3"
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            transform: 'rotate(45deg)',
          }}
        />
      </div>

      {/* Contenido principal del panel */}
      <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

        {/* Logo */}
        <div className="auth-fade-up-1">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg group-hover:bg-white/22 transition-colors duration-200 backdrop-blur-sm">
              <Zap className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
            </div>
            <span className="text-[17px] font-bold text-white tracking-tight">
              Padel Club OS
            </span>
          </Link>
        </div>

        {/* Contenido central — empujado al fondo */}
        <div className="mt-auto">

          {/* Badge de modo */}
          <div className="auth-fade-up-2 mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase text-white/90"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Star className="w-3 h-3 fill-amber-300 text-amber-300 flex-shrink-0" />
              {modo === 'registro' ? '14 dias de prueba gratuita' : 'La plataforma lider en Espana'}
            </span>
          </div>

          {/* Titular principal */}
          <h1 className="auth-fade-up-2 font-bold text-white leading-[1.08] tracking-tight"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
          >
            {modo === 'registro' ? (
              <>
                La plataforma que{' '}
                <span
                  style={{
                    background: 'linear-gradient(92deg, #c4b5fd 0%, #93c5fd 60%, #a5f3fc 100%)',
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
                    background: 'linear-gradient(92deg, #c4b5fd 0%, #93c5fd 60%, #a5f3fc 100%)',
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

          <p className="auth-fade-up-3 mt-4 text-base text-white/65 leading-relaxed max-w-xs">
            {modo === 'registro'
              ? 'Digitaliza tu club en minutos. Reservas, socios, torneos y analiticas en un solo lugar.'
              : 'Accede a tu panel de gestion y mantente al dia con todo lo que ocurre en tu club.'}
          </p>

          {/* Lista de beneficios — lineas limpias estilo Linear */}
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
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Icono className="w-3.5 h-3.5 text-white/85" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-snug">{item.titulo}</p>
                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{item.descripcion}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Separador */}
          <div className="auth-fade-up-6 mt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

          {/* Social proof — testimonial compacto */}
          <div className="auth-fade-up-6 mt-6">
            <div className="flex items-start gap-4">
              {/* Avatares */}
              <div className="flex -space-x-2 flex-shrink-0 mt-0.5">
                {[
                  { bg: '#7C3AED', letra: 'J' },
                  { bg: '#4F46E5', letra: 'M' },
                  { bg: '#0891B2', letra: 'A' },
                  { bg: '#059669', letra: 'R' },
                ].map(({ bg, letra }, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      background: bg,
                      border: '2px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-xs font-semibold text-white/80">5.0</span>
                </div>
                <p className="text-xs text-white/55 leading-relaxed">
                  <span className="font-semibold text-white/75">+500 clubes</span>{' '}
                  confian en Padel Club OS
                </p>
              </div>
            </div>

            {/* Testimonial */}
            <div
              className="mt-4 rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p className="text-sm text-white/65 leading-relaxed">
                &ldquo;Pasamos de hojas de calculo a tener todo automatizado en menos de una semana.
                Las reservas aumentaron un{' '}
                <span className="text-white/85 font-medium">40%</span> el primer mes.&rdquo;
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(124,58,237,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <span className="text-[9px] font-bold text-white">JM</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/80">Jorge Morales</p>
                    <p className="text-[11px] text-white/45">Director, Club Padel Valencia</p>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/25" />
              </div>
            </div>
          </div>

          {/* Garantias — fila final */}
          <div className="auth-fade-up-6 mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {garantias.map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-white/50">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
