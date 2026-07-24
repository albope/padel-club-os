import { DEFAULT_IMAGES } from "./default-images"

/**
 * Avatar local por defecto. Evita dependencias y tracking de servicios externos
 * y garantiza que una persona sin foto nunca deja un hueco roto.
 */
export function urlAvatar(
  _nombre: string | null | undefined,
  _fondoLegacy = "random",
): string {
  return DEFAULT_IMAGES.player
}
