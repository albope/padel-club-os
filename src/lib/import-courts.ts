// Funciones puras para importacion de pistas con pricing
// Extraidas para facilitar testing sin mock de DB

export interface PricingRule {
  dayOfWeek: number
  startHour: number
  endHour: number
  price: number
}

export interface PistaImportada {
  nombre: string
  tipo: string
  precios: PricingRule[]
  fila: number
}

export interface ImportError {
  fila: number
  campo: string
  mensaje: string
}

export interface PricingColumnMapping {
  columnIndex: number
  headerName: string
  dayOfWeek: number
  startHour: number
  endHour: number
}

// Whitelist de dias en espanol -> dayOfWeek (0=domingo, 6=sabado)
const DIAS_VALIDOS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  "miércoles": 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  "sábado": 6,
}

/** Normaliza un nombre para comparacion case-insensitive: trim + collapse spaces + lowercase */
export function normalizarNombre(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase()
}

/** Parsea un header de pricing con formato dia_horaInicio-horaFin */
export function parsearHeaderPricing(header: string): { dayOfWeek: number; startHour: number; endHour: number } | null {
  const match = header.trim().match(/^([a-záéíóúñü]+)_(\d{1,2})-(\d{1,2})$/i)
  if (!match) return null

  const diaStr = match[1].toLowerCase()
  const dayOfWeek = DIAS_VALIDOS[diaStr]
  if (dayOfWeek === undefined) return null

  const startHour = parseInt(match[2], 10)
  const endHour = parseInt(match[3], 10)

  if (startHour < 0 || startHour > 23) return null
  if (endHour < 1 || endHour > 24) return null
  if (startHour >= endHour) return null

  return { dayOfWeek, startHour, endHour }
}

/** Parsea todos los headers y retorna mappings de columnas pricing + errores */
export function parsearHeadersPricing(headers: string[]): {
  mappings: PricingColumnMapping[]
  errors: string[]
} {
  const mappings: PricingColumnMapping[] = []
  const errors: string[] = []

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim().toLowerCase()
    if (h === "nombre" || h === "tipo" || h === "") continue

    // Detectar si parece una columna de pricing (tiene _ y -)
    if (h.includes("_") && h.includes("-")) {
      const parsed = parsearHeaderPricing(headers[i])
      if (parsed) {
        mappings.push({
          columnIndex: i,
          headerName: headers[i].trim(),
          ...parsed,
        })
      } else {
        errors.push(`Columna de precio no valida: "${headers[i].trim()}"`)
      }
    }
    // Si no parece pricing, ignorar silenciosamente (podria ser una columna extra)
  }

  return { mappings, errors }
}

/** Parsea un valor de precio, soportando coma decimal espanola */
export function parsearPrecio(valor: string): number | null {
  const trimmed = valor.trim()
  if (trimmed === "") return null // celda vacia = sin precio

  const normalizado = trimmed.replace(",", ".")
  const num = parseFloat(normalizado)

  if (isNaN(num)) return null
  return num
}

/** Deduplicar pistas por nombre normalizado dentro de un CSV. Primera ocurrencia gana. */
export function dedupPistasCSV(pistas: PistaImportada[]): {
  unicas: PistaImportada[]
  errors: ImportError[]
} {
  const vistos = new Map<string, number>() // normalizedName -> fila original
  const unicas: PistaImportada[] = []
  const errors: ImportError[] = []

  for (const pista of pistas) {
    const norm = normalizarNombre(pista.nombre)
    const filaAnterior = vistos.get(norm)
    if (filaAnterior !== undefined) {
      errors.push({
        fila: pista.fila,
        campo: "nombre",
        mensaje: `Nombre duplicado en CSV: "${pista.nombre}" (ya aparece en fila ${filaAnterior})`,
      })
    } else {
      vistos.set(norm, pista.fila)
      unicas.push(pista)
    }
  }

  return { unicas, errors }
}

/** Deduplicar reglas de pricing por dayOfWeek+startHour. Ultima gana. */
export function dedupPreciosIntraPista(precios: PricingRule[]): PricingRule[] {
  const mapa = new Map<string, PricingRule>()
  for (const p of precios) {
    mapa.set(`${p.dayOfWeek}-${p.startHour}`, p)
  }
  return Array.from(mapa.values())
}
