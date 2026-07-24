/**
 * Feature flags de la plataforma.
 *
 * Identidad «Marcador» (design_handoff_identidad_marcador).
 *
 * La migracion ya es la identidad estable del producto. El helper permanece
 * temporalmente para no mezclar esta retirada con una reescritura masiva de
 * componentes, pero ya no depende del entorno.
 */
export function temaMarcadorActivo(): boolean {
  return true
}

/** Clase CSS que activa los tokens de la identidad «Marcador» en globals.css */
export const CLASE_TEMA_MARCADOR = "theme-marcador"
