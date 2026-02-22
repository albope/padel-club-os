// Utilidades para generacion de CSV

/**
 * Escapa un valor para CSV: si contiene comas, comillas o saltos de linea,
 * lo envuelve en comillas dobles y duplica las comillas internas.
 */
export function escaparCSV(valor: string): string {
  if (valor.includes(",") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

/**
 * Genera un string CSV completo con BOM UTF-8 para compatibilidad con Excel.
 */
export function generarCSV(cabeceras: string[], filas: string[][]): string {
  const BOM = "\uFEFF"
  const lineas = [
    cabeceras.map(escaparCSV).join(","),
    ...filas.map((fila) => fila.map(escaparCSV).join(",")),
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
