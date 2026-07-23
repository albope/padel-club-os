/**
 * Motor de color de tenant — identidad «Marcador» (fase 4 del handoff).
 *
 * A partir del hex `club.primaryColor` genera una escala 50-900 en OKLCH
 * (croma máx 0.17) y los derivados accesibles para claro y oscuro:
 * primary, on-primary (blanco o tinta según contraste >= 4.5:1), hover,
 * pressed y tint-50. El modo oscuro usa el tono 400 de la escala.
 *
 * Superficies permitidas del color de tenant: CTA primaria del jugador,
 * nav activa y acentos de identidad. Prohibidas: semánticos de estado,
 * texto de párrafo, celdas del grid, dataviz y todo el admin.
 */

const BLANCO = '#FFFFFF'
const TINTA = '#1C1A17'
const COLOR_FALLBACK = '#4F46E5'
const CROMA_MAX = 0.17
const CONTRASTE_AA = 4.5

/** L objetivo (OKLCH, 0-1) y factor de croma por paso de la escala */
const PASOS_ESCALA = [
  { paso: 50, l: 0.96, croma: 0.25 },
  { paso: 100, l: 0.93, croma: 0.4 },
  { paso: 200, l: 0.88, croma: 0.6 },
  { paso: 300, l: 0.8, croma: 0.8 },
  { paso: 400, l: 0.72, croma: 0.95 },
  { paso: 500, l: 0.62, croma: 1 },
  { paso: 600, l: 0.53, croma: 1 },
  { paso: 700, l: 0.45, croma: 0.9 },
  { paso: 800, l: 0.37, croma: 0.75 },
  { paso: 900, l: 0.29, croma: 0.6 },
] as const

export type PasoEscala = (typeof PASOS_ESCALA)[number]['paso']

export interface ColoresTenant {
  primary: string
  onPrimary: string
  hover: string
  pressed: string
  tint50: string
}

export interface TemaTenant {
  /** false si el hex de entrada no era parseable (se usa el fallback) */
  valido: boolean
  escala: Record<PasoEscala, string>
  claro: ColoresTenant
  oscuro: ColoresTenant
  contraste: {
    /** ratio del texto elegido sobre primary en claro */
    ratioClaro: number
    ratioOscuro: number
    /** texto elegido en claro */
    textoClaro: 'blanco' | 'tinta'
    /** true si hubo que ajustar la luminosidad para alcanzar 4.5:1 */
    ajustado: boolean
  }
}

// ─── Conversión de color ────────────────────────────────────────────────────

interface Rgb {
  r: number
  g: number
  b: number
}

interface Oklch {
  l: number
  c: number
  h: number
}

export function parsearHex(hex: string): Rgb | null {
  const limpio = hex.trim().replace(/^#/, '')
  const largo =
    limpio.length === 3
      ? limpio
          .split('')
          .map((c) => c + c)
          .join('')
      : limpio
  if (!/^[0-9a-fA-F]{6}$/.test(largo)) return null
  return {
    r: parseInt(largo.slice(0, 2), 16) / 255,
    g: parseInt(largo.slice(2, 4), 16) / 255,
    b: parseInt(largo.slice(4, 6), 16) / 255,
  }
}

function aHex({ r, g, b }: Rgb): string {
  const canal = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${canal(r)}${canal(g)}${canal(b)}`.toUpperCase()
}

function srgbALineal(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function linealASrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

function rgbAOklch(rgb: Rgb): Oklch {
  const r = srgbALineal(rgb.r)
  const g = srgbALineal(rgb.g)
  const b = srgbALineal(rgb.b)

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  const c = Math.sqrt(a * a + bb * bb)
  let h = (Math.atan2(bb, a) * 180) / Math.PI
  if (h < 0) h += 360
  return { l: L, c, h }
}

function oklchARgbCrudo({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const bb = c * Math.sin(rad)

  const l_ = l + 0.3963377774 * a + 0.2158037573 * bb
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bb
  const s_ = l - 0.0894841775 * a - 1.291485548 * bb

  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  return {
    r: linealASrgb(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    g: linealASrgb(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    b: linealASrgb(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  }
}

function enGama(rgb: Rgb): boolean {
  const eps = 1e-4
  return (
    rgb.r >= -eps && rgb.r <= 1 + eps && rgb.g >= -eps && rgb.g <= 1 + eps && rgb.b >= -eps && rgb.b <= 1 + eps
  )
}

/** OKLCH → hex reduciendo croma hasta entrar en la gama sRGB */
function oklchAHex(color: Oklch): string {
  let rgb = oklchARgbCrudo(color)
  if (enGama(rgb)) return aHex(rgb)

  let bajo = 0
  let alto = color.c
  for (let i = 0; i < 20; i++) {
    const medio = (bajo + alto) / 2
    rgb = oklchARgbCrudo({ ...color, c: medio })
    if (enGama(rgb)) bajo = medio
    else alto = medio
  }
  return aHex(oklchARgbCrudo({ ...color, c: bajo }))
}

// ─── Contraste WCAG ─────────────────────────────────────────────────────────

function luminanciaRelativa(rgb: Rgb): number {
  return 0.2126 * srgbALineal(rgb.r) + 0.7152 * srgbALineal(rgb.g) + 0.0722 * srgbALineal(rgb.b)
}

export function ratioContraste(hexA: string, hexB: string): number {
  const a = parsearHex(hexA)
  const b = parsearHex(hexB)
  if (!a || !b) return 1
  const la = luminanciaRelativa(a)
  const lb = luminanciaRelativa(b)
  const [claro, oscuro] = la >= lb ? [la, lb] : [lb, la]
  return (claro + 0.05) / (oscuro + 0.05)
}

// ─── Motor ──────────────────────────────────────────────────────────────────

function derivarColores(
  base: Oklch,
  tint50: string,
  modo: 'claro' | 'oscuro'
): { colores: ColoresTenant; ratio: number; texto: 'blanco' | 'tinta'; ajustado: boolean } {
  let l = base.l
  let ajustado = false
  let primary = oklchAHex({ ...base, l })
  let texto: 'blanco' | 'tinta' =
    ratioContraste(primary, BLANCO) >= CONTRASTE_AA
      ? 'blanco'
      : ratioContraste(primary, TINTA) >= CONTRASTE_AA
        ? 'tinta'
        : 'blanco'

  // Gama accesible: si ni blanco ni tinta llegan a 4.5:1, oscurecer hasta que
  // el blanco cumpla (zona muerta de luminancia media)
  if (ratioContraste(primary, BLANCO) < CONTRASTE_AA && ratioContraste(primary, TINTA) < CONTRASTE_AA) {
    ajustado = true
    for (let i = 0; i < 40 && ratioContraste(primary, BLANCO) < CONTRASTE_AA; i++) {
      l -= 0.01
      primary = oklchAHex({ ...base, l })
    }
    texto = 'blanco'
  }

  const onPrimary = texto === 'blanco' ? BLANCO : TINTA
  // Hover/pressed: claro oscurece (L-6/L-12), oscuro aclara
  const dir = modo === 'claro' ? -1 : 1
  const hover = oklchAHex({ ...base, l: Math.min(0.97, Math.max(0.15, l + dir * 0.06)) })
  const pressed = oklchAHex({ ...base, l: Math.min(0.97, Math.max(0.12, l + dir * 0.12)) })

  return {
    colores: { primary, onPrimary, hover, pressed, tint50 },
    ratio: ratioContraste(primary, onPrimary),
    texto,
    ajustado,
  }
}

export function generarTemaTenant(hexEntrada: string | null | undefined): TemaTenant {
  const rgb = parsearHex(hexEntrada || '')
  const valido = rgb !== null
  const base = rgbAOklch(rgb ?? parsearHex(COLOR_FALLBACK)!)
  const croma = Math.min(base.c, CROMA_MAX)

  const escala = {} as Record<PasoEscala, string>
  for (const { paso, l, croma: factor } of PASOS_ESCALA) {
    escala[paso] = oklchAHex({ l, c: croma * factor, h: base.h })
  }

  // Claro: tono 600; oscuro: tono 400 (con texto tinta casi siempre)
  const claro = derivarColores({ l: 0.53, c: croma, h: base.h }, escala[50], 'claro')
  const oscuro = derivarColores({ l: 0.72, c: croma * 0.95, h: base.h }, escala[900], 'oscuro')

  return {
    valido,
    escala,
    claro: claro.colores,
    oscuro: oscuro.colores,
    contraste: {
      ratioClaro: Math.round(claro.ratio * 10) / 10,
      ratioOscuro: Math.round(oscuro.ratio * 10) / 10,
      textoClaro: claro.texto,
      ajustado: claro.ajustado || oscuro.ajustado,
    },
  }
}

/**
 * Variables CSS para el ámbito de tenant (portal del club). Se consumen via
 * `var(--tenant-*)` gracias al mapeo `.ambito-tenant` de globals.css, que
 * elige el juego claro u oscuro según el tema activo.
 */
export function varsTenant(tema: TemaTenant): Record<string, string> {
  return {
    '--tenant-primary-claro': tema.claro.primary,
    '--tenant-on-primary-claro': tema.claro.onPrimary,
    '--tenant-hover-claro': tema.claro.hover,
    '--tenant-pressed-claro': tema.claro.pressed,
    '--tenant-tint-50-claro': tema.claro.tint50,
    '--tenant-primary-oscuro': tema.oscuro.primary,
    '--tenant-on-primary-oscuro': tema.oscuro.onPrimary,
    '--tenant-hover-oscuro': tema.oscuro.hover,
    '--tenant-pressed-oscuro': tema.oscuro.pressed,
    '--tenant-tint-50-oscuro': tema.oscuro.tint50,
  }
}
