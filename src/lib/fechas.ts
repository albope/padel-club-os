// Utilidades de fechas en hora LOCAL, pensadas para codigo de cliente
// (el navegador ya esta en la zona del usuario). Para instantes de reserva
// en codigo servidor usar src/lib/timezone.ts (hora de pared Europe/Madrid).

const FORMATO_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/

/** Formatea una Date como YYYY-MM-DD usando la hora local. */
export function formatearFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, "0")
  const dia = String(fecha.getDate()).padStart(2, "0")
  return `${anio}-${mes}-${dia}`
}

/** Valida que un string sea una fecha real con formato YYYY-MM-DD. */
export function esFechaISOValida(fecha: string): boolean {
  if (!FORMATO_FECHA_ISO.test(fecha)) return false
  const d = new Date(`${fecha}T12:00:00`)
  if (Number.isNaN(d.getTime())) return false
  // Date normaliza fechas imposibles (2026-02-31 -> 3 de marzo): rechazarlas
  return formatearFechaLocal(d) === fecha
}

/**
 * Proxima fecha (hoy incluido) que cae en el mismo dia de la semana que la
 * fecha original. Devuelve YYYY-MM-DD en hora local.
 * Ej: reserva original en martes -> el proximo martes (o hoy si es martes).
 */
export function proximaFechaMismoDiaSemana(fechaOriginal: Date, hoy: Date = new Date()): string {
  const dias = (fechaOriginal.getDay() - hoy.getDay() + 7) % 7
  const objetivo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + dias, 12, 0, 0)
  return formatearFechaLocal(objetivo)
}

interface PreferenciaRepeticion {
  fecha: string
  pistaId: string
  hora: string
}

/**
 * Obtiene la siguiente fecha, pista y hora equivalentes para repetir una
 * reserva desde el navegador. Si la hora de hoy ya ha pasado, salta una semana.
 */
export function crearPreferenciaRepeticion(
  pistaId: string,
  inicioOriginal: Date,
  ahora: Date = new Date(),
): PreferenciaRepeticion {
  let fecha = proximaFechaMismoDiaSemana(inicioOriginal, ahora)
  const hora = `${String(inicioOriginal.getHours()).padStart(2, "0")}:${String(inicioOriginal.getMinutes()).padStart(2, "0")}`
  const minutosOriginales = inicioOriginal.getHours() * 60 + inicioOriginal.getMinutes()
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes()

  if (fecha === formatearFechaLocal(ahora) && minutosOriginales <= minutosActuales) {
    const semanaSiguiente = new Date(`${fecha}T12:00:00`)
    semanaSiguiente.setDate(semanaSiguiente.getDate() + 7)
    fecha = formatearFechaLocal(semanaSiguiente)
  }

  return { fecha, pistaId, hora }
}
