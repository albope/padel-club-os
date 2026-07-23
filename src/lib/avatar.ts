import { temaMarcadorActivo } from './feature-flags'

/**
 * URL de avatar de iniciales (ui-avatars.com).
 *
 * Identidad «Marcador»: inicial sobre verde marca con texto papel — se retira
 * el indigo #6366f1 y el background aleatorio. Con el flag apagado se conserva
 * el fondo legacy que tuviera cada pantalla.
 */
export function urlAvatar(nombre: string | null | undefined, fondoLegacy = 'random'): string {
  const base = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre || 'U')}`
  if (temaMarcadorActivo()) {
    return `${base}&background=157A54&color=F6F3ED`
  }
  return `${base}&background=${fondoLegacy}&color=fff`
}
