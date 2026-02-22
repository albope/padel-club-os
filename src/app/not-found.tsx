import Link from "next/link";
import { Home } from "lucide-react";
import { BotonVolver } from "@/components/not-found/BotonVolver";

/* ─── Pelota de padel SVG ────────────────────────────────────────────────── */

function PelotaPadel({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cuerpo de la pelota */}
      <circle cx="60" cy="60" r="54" fill="url(#pelota-grad)" />
      {/* Linea curva caracteristica */}
      <path
        d="M28 38c16 8 28 28 12 52"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M92 82c-16-8-28-28-12-52"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Brillo */}
      <ellipse cx="42" cy="36" rx="14" ry="10" fill="white" opacity="0.18" transform="rotate(-20 42 36)" />
      <defs>
        <radialGradient id="pelota-grad" cx="0.35" cy="0.3" r="0.65">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ─── Raqueta de padel SVG ───────────────────────────────────────────────── */

function RaquetaPadel({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Mango */}
      <rect x="33" y="110" width="14" height="58" rx="7" fill="url(#mango-grad)" />
      <rect x="35" y="112" width="10" height="54" rx="5" fill="url(#mango-inner)" opacity="0.5" />
      {/* Cabeza de la raqueta */}
      <ellipse cx="40" cy="58" rx="36" ry="52" fill="url(#raqueta-grad)" />
      <ellipse cx="40" cy="58" rx="32" ry="48" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
      {/* Agujeros */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={20 + col * 14}
            cy={28 + row * 14}
            r="3.5"
            fill="hsl(217 91% 60%)"
            opacity="0.25"
          />
        ))
      )}
      <defs>
        <linearGradient id="raqueta-grad" x1="40" y1="6" x2="40" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(217 91% 60%)" />
          <stop offset="100%" stopColor="hsl(217 91% 45%)" />
        </linearGradient>
        <linearGradient id="mango-grad" x1="40" y1="110" x2="40" y2="168" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        <linearGradient id="mango-inner" x1="40" y1="112" x2="40" y2="166" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Pagina 404 ─────────────────────────────────────────────────────────── */

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Fondo con gradient animado */}
      <div className="absolute inset-0 auth-gradient-bg" />

      {/* Textura sutil */}
      <div aria-hidden="true" className="absolute inset-0 auth-dot-pattern opacity-30" />

      {/* Orbes de luz */}
      <div
        aria-hidden="true"
        className="auth-orb auth-float-1 w-[420px] h-[420px] -top-20 -right-20"
        style={{ background: "radial-gradient(circle, rgba(107,188,226,0.35) 0%, transparent 60%)" }}
      />
      <div
        aria-hidden="true"
        className="auth-orb auth-float-2 w-[350px] h-[350px] -bottom-16 -left-16"
        style={{ background: "radial-gradient(circle, rgba(32,106,245,0.20) 0%, transparent 60%)" }}
      />
      <div
        aria-hidden="true"
        className="auth-orb auth-float-3 w-[200px] h-[200px] top-[30%] right-[15%]"
        style={{ background: "radial-gradient(circle, rgba(250,204,21,0.18) 0%, transparent 60%)" }}
      />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">

        {/* Ilustracion: raqueta + pelota */}
        <div className="auth-fade-up-1 relative w-48 h-48 mb-2">
          <RaquetaPadel className="absolute left-2 top-2 w-24 h-auto opacity-80 -rotate-[25deg]" />
          <PelotaPadel className="absolute right-2 bottom-4 w-20 h-20 notfound-bounce" />
        </div>

        {/* 404 grande con gradiente */}
        <h1
          className="auth-fade-up-2 font-extrabold tracking-tighter leading-none"
          style={{
            fontSize: "clamp(6rem, 15vw, 10rem)",
            background: "linear-gradient(92deg, hsl(217,91%,50%) 0%, hsl(197,85%,48%) 55%, hsl(180,75%,45%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </h1>

        {/* Mensaje */}
        <p className="auth-fade-up-3 text-xl font-semibold text-slate-800 dark:text-slate-100 mt-2">
          ¡Bola fuera!
        </p>
        <p className="auth-fade-up-4 text-base text-slate-500 dark:text-slate-400 mt-3 leading-relaxed max-w-sm">
          Parece que esta página se ha ido fuera de la pista. Vuelve al centro de la cancha y sigue jugando.
        </p>

        {/* Botones */}
        <div className="auth-fade-up-5 flex flex-col sm:flex-row items-center gap-3 mt-8">
          <Link
            href="/"
            className="auth-solid-btn inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white"
          >
            <Home className="w-4 h-4" />
            Volver al inicio
          </Link>
          <BotonVolver />
        </div>

        {/* Linea decorativa */}
        <div
          className="auth-fade-up-6 mt-10 mx-auto"
          style={{
            width: 48,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, hsl(217,91%,60%), hsl(197,85%,55%))",
            opacity: 0.4,
          }}
        />
      </div>
    </div>
  );
}
