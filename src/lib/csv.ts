// Utilidades compartidas para lectura y generacion de CSV

export type CSVDelimiter = ',' | ';'

export interface CSVRow {
  values: string[]
  line: number
}

export interface CSVParseError {
  line: number
  message: string
}

export interface CSVParseResult {
  rows: CSVRow[]
  delimiter: CSVDelimiter
  errors: CSVParseError[]
}

function detectDelimiter(text: string): CSVDelimiter {
  let commas = 0
  let semicolons = 0
  let quoted = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        index++
      } else {
        quoted = !quoted
      }
    } else if (!quoted && (char === '\n' || char === '\r')) {
      break
    } else if (!quoted && char === ',') {
      commas++
    } else if (!quoted && char === ';') {
      semicolons++
    }
  }

  return semicolons > commas ? ';' : ','
}

/**
 * Lee CSV de Excel y otros sistemas sin depender de un separador fijo.
 * Admite BOM, `sep=;`, comas o punto y coma, comillas escapadas y saltos
 * de linea dentro de una celda.
 */
export function parsearCSV(input: string): CSVParseResult {
  let text = input.replace(/^\uFEFF/, '')
  let initialLine = 1
  let forcedDelimiter: CSVDelimiter | null = null
  const directive = /^sep=([,;])(?:\r?\n|\r)/i.exec(text)
  if (directive) {
    forcedDelimiter = directive[1] as CSVDelimiter
    text = text.slice(directive[0].length)
    initialLine = 2
  }

  const delimiter = forcedDelimiter || detectDelimiter(text)
  const rows: CSVRow[] = []
  const errors: CSVParseError[] = []
  let values: string[] = []
  let field = ''
  let quoted = false
  let line = initialLine
  let rowLine = initialLine

  const pushRow = () => {
    values.push(field)
    if (values.some((value) => value.trim() !== '')) {
      rows.push({ values, line: rowLine })
    }
    values = []
    field = ''
    rowLine = line
  }

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index++
      } else {
        quoted = !quoted
      }
    } else if (char === delimiter && !quoted) {
      values.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index++
      pushRow()
      line++
      rowLine = line
    } else {
      field += char
      if (char === '\n') line++
    }
  }

  if (quoted) {
    errors.push({ line: rowLine, message: 'La fila contiene comillas sin cerrar' })
  }
  if (field.length > 0 || values.length > 0) pushRow()

  return { rows, delimiter, errors }
}

/**
 * Escapa un valor para CSV: si contiene comas, comillas o saltos de linea,
 * lo envuelve en comillas dobles y duplica las comillas internas.
 */
export function escaparCSV(valor: string, delimiter: CSVDelimiter = ','): string {
  if (valor.includes(delimiter) || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

/**
 * Genera un string CSV completo con BOM UTF-8 para compatibilidad con Excel.
 */
export function generarCSV(
  cabeceras: string[],
  filas: string[][],
  delimiter: CSVDelimiter = ',',
): string {
  const BOM = "\uFEFF"
  const lineas = [
    cabeceras.map((valor) => escaparCSV(valor, delimiter)).join(delimiter),
    ...filas.map((fila) =>
      fila.map((valor) => escaparCSV(valor, delimiter)).join(delimiter),
    ),
  ]
  return BOM + lineas.join("\n")
}

/**
 * Formatea una fecha a DD/MM/YYYY en timezone Europe/Madrid.
 */
export function formatearFechaCSV(fecha: Date): string {
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Madrid",
  })
}

/**
 * Formatea una hora a HH:MM en timezone Europe/Madrid.
 */
export function formatearHoraCSV(fecha: Date): string {
  return fecha.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Madrid",
  })
}
