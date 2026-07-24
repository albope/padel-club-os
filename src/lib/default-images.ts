export const DEFAULT_IMAGES = {
  clubHero: "/images/defaults/club-hero.webp",
  court: "/images/defaults/court.webp",
  news: "/images/defaults/news.webp",
  player: "/images/defaults/player.webp",
} as const

export function imagenConFallback(
  value: string | null | undefined,
  fallback: keyof typeof DEFAULT_IMAGES,
): string {
  return value?.trim() || DEFAULT_IMAGES[fallback]
}
