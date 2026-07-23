/**
 * Feature flags de la plataforma.
 *
 * Identidad «Marcador» (design_handoff_identidad_marcador): se activa por
 * entorno con NEXT_PUBLIC_TEMA_MARCADOR="true". Al estar inlined en build,
 * funciona igual en Server y Client Components. Cuando la migracion visual
 * termine (fase 5), el flag y el tema antiguo se retiran.
 */
export function temaMarcadorActivo(): boolean {
  return (
    process.env.NEXT_PUBLIC_TEMA_MARCADOR === "true" ||
    process.env.NEXT_PUBLIC_TEMA_MARCADOR === "1"
  )
}

/** Clase CSS que activa los tokens de la identidad «Marcador» en globals.css */
export const CLASE_TEMA_MARCADOR = "theme-marcador"
