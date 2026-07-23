/**
 * Lint anti clases de color crudas (Fase 1 identidad «Marcador»).
 *
 * La nueva identidad obliga a usar tokens semanticos (bg-primary, text-info,
 * bg-warning-bg...) en lugar de la paleta cruda de Tailwind (bg-blue-500,
 * text-indigo-600, bg-[#6366f1]...). Como el codigo legado tiene cientos de
 * usos, funciona como ratchet: compara contra scripts/colores-crudos-baseline.json
 * y falla solo si un fichero SUPERA su baseline o un fichero nuevo introduce
 * colores crudos. Al migrar pantallas (fases 2-5) la baseline solo puede bajar.
 *
 * Uso:
 *   node scripts/lint-colores-crudos.mjs           # chequea (lo ejecuta npm run lint)
 *   node scripts/lint-colores-crudos.mjs --update  # regenera la baseline
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"

const RAIZ = path.resolve(process.cwd(), "src")
const RUTA_BASELINE = path.resolve(process.cwd(), "scripts", "colores-crudos-baseline.json")

const PREFIJOS =
  "(?:bg|text|border(?:-[trblxyse])?|from|via|to|ring(?:-offset)?|fill|stroke|outline|decoration|divide|accent|caret|shadow)"
const PALETA =
  "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)"
const RE_PALETA = new RegExp(`\\b${PREFIJOS}-${PALETA}-(?:50|[1-9]00|950)(?:/\\d{1,3})?\\b`, "g")
const RE_HEX = new RegExp(`\\b${PREFIJOS}-\\[#[0-9a-fA-F]{3,8}\\]`, "g")

function listarFicheros(dir) {
  const resultado = []
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name)
    if (entrada.isDirectory()) {
      resultado.push(...listarFicheros(ruta))
    } else if (/\.(ts|tsx)$/.test(entrada.name)) {
      resultado.push(ruta)
    }
  }
  return resultado
}

function contarViolaciones() {
  const conteos = {}
  for (const fichero of listarFicheros(RAIZ)) {
    const contenido = readFileSync(fichero, "utf8")
    const total =
      (contenido.match(RE_PALETA) ?? []).length + (contenido.match(RE_HEX) ?? []).length
    if (total > 0) {
      const clave = path.relative(process.cwd(), fichero).replaceAll("\\", "/")
      conteos[clave] = total
    }
  }
  return conteos
}

const actual = contarViolaciones()

if (process.argv.includes("--update")) {
  writeFileSync(RUTA_BASELINE, JSON.stringify(actual, null, 2) + "\n")
  const total = Object.values(actual).reduce((a, b) => a + b, 0)
  console.log(`Baseline regenerada: ${Object.keys(actual).length} ficheros, ${total} usos.`)
  process.exit(0)
}

let baseline
try {
  baseline = JSON.parse(readFileSync(RUTA_BASELINE, "utf8"))
} catch {
  console.error(
    `No se pudo leer ${path.relative(process.cwd(), RUTA_BASELINE)}. ` +
      "Genera la baseline con: node scripts/lint-colores-crudos.mjs --update"
  )
  process.exit(1)
}

const errores = []
for (const [fichero, conteo] of Object.entries(actual)) {
  const permitido = baseline[fichero] ?? 0
  if (conteo > permitido) {
    errores.push(`  ${fichero}: ${conteo} clases de color crudas (baseline: ${permitido})`)
  }
}

if (errores.length > 0) {
  console.error("Colores crudos nuevos detectados (usa tokens semanticos del tema):")
  console.error(errores.join("\n"))
  console.error(
    "\nUsa bg-primary, text-muted-foreground, text-info, bg-warning-bg, etc. " +
      "(ver docs/identidad-marcador.md). Si migraste un fichero y bajaste usos, " +
      "regenera la baseline con: node scripts/lint-colores-crudos.mjs --update"
  )
  process.exit(1)
}

const totalActual = Object.values(actual).reduce((a, b) => a + b, 0)
const totalBaseline = Object.values(baseline).reduce((a, b) => a + b, 0)
if (totalActual < totalBaseline) {
  console.log(
    `Colores crudos: ${totalActual}/${totalBaseline} (bajaron; puedes fijar el avance con --update)`
  )
} else {
  console.log(`Colores crudos: OK (${totalActual} usos legados, sin regresiones)`)
}
