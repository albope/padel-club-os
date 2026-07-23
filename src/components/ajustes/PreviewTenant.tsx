'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { generarTemaTenant, type ColoresTenant } from '@/lib/tenant-theme';

interface PreviewTenantProps {
  color: string;
  nombreClub?: string;
}

/**
 * Previsualización en vivo del color de marca (frame 3d del handoff):
 * check de contraste automático + mini portal en claro y oscuro con los
 * colores ya ajustados por el motor de tenant.
 */
function MiniPortal({
  colores,
  nombre,
  oscuro,
}: {
  colores: ColoresTenant;
  nombre: string;
  oscuro?: boolean;
}) {
  // Superficies FIJAS del mock (papel/tinta del design system): el preview
  // muestra ambos modos a la vez, no puede depender del tema activo.
  const superficie = oscuro
    ? { backgroundColor: '#14120F', borderColor: '#37322A' }
    : { backgroundColor: '#F6F3ED', borderColor: '#DDD7CC' };
  const texto = { color: oscuro ? '#F1EDE4' : '#1C1A17' };
  const separador = { borderColor: oscuro ? '#37322A' : '#E7E2D8' };

  return (
    <div className="flex-1 min-w-0 rounded-xl border overflow-hidden" style={superficie}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={separador}>
        <span
          className="h-6 w-6 rounded-[7px] flex items-center justify-center text-[11px] font-bold font-display shrink-0"
          style={{ backgroundColor: colores.primary, color: colores.onPrimary }}
        >
          {nombre.charAt(0).toUpperCase()}
        </span>
        <span className="text-xs font-semibold truncate font-display" style={texto}>
          {nombre}
        </span>
      </div>
      <div className="p-3 space-y-2">
        <div
          className="h-1 w-10 rounded-full"
          style={{ backgroundColor: colores.primary }}
          aria-hidden="true"
        />
        <button
          type="button"
          tabIndex={-1}
          className="w-full h-9 rounded-md text-xs font-bold pointer-events-none"
          style={{ backgroundColor: colores.primary, color: colores.onPrimary }}
        >
          Reservar pista
        </button>
      </div>
    </div>
  );
}

export function PreviewTenant({ color, nombreClub = 'Tu club' }: PreviewTenantProps) {
  const tema = useMemo(() => generarTemaTenant(color), [color]);

  const textoElegido = tema.contraste.textoClaro === 'blanco' ? 'blanco' : 'oscuro';
  const ratioFormateado = tema.contraste.ratioClaro.toLocaleString('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div className="space-y-3">
      {/* Check de contraste automático */}
      {tema.contraste.ajustado ? (
        <div
          className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-bg px-3 py-2.5"
          role="status"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning-foreground" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-warning-foreground">
            <strong>Color difícil para el contraste.</strong> Hemos ajustado la luminosidad en los
            botones para garantizar 4,5:1 (AA). Texto {textoElegido} sobre tu color:{' '}
            {ratioFormateado}:1.
          </p>
        </div>
      ) : (
        <div
          className="flex items-start gap-2 rounded-md border border-success-border bg-success-bg px-3 py-2.5"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-success-foreground" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-success-foreground">
            <strong>Contraste correcto.</strong> Texto {textoElegido} sobre tu color:{' '}
            {ratioFormateado}:1 (AA). Generada escala 50–900 para claro y oscuro.
          </p>
        </div>
      )}

      {/* Preview claro / oscuro */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
          Previsualización en vivo · portal del jugador
        </p>
        <div className="flex gap-3">
          <MiniPortal colores={tema.claro} nombre={nombreClub} />
          <MiniPortal colores={tema.oscuro} nombre={nombreClub} oscuro />
        </div>
      </div>
    </div>
  );
}
