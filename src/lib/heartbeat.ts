// Tiempo maximo de espera del ping: el heartbeat nunca debe retrasar un cron
const HEARTBEAT_TIMEOUT_MS = 5000

/**
 * Envia un ping a un servicio de heartbeat (healthchecks.io) para señalar
 * que un cron ha terminado con exito. Si el ping no llega en el periodo
 * esperado, el servicio alerta al dueño por email.
 *
 * - Si la URL no esta definida (local, CI), no hace nada.
 * - Nunca lanza: cualquier fallo de red se ignora en silencio.
 * - Se espera con await para garantizar el envio en serverless (Vercel
 *   congela la funcion al devolver la respuesta), acotado a 5s.
 */
export async function pingHeartbeat(url: string | undefined): Promise<void> {
  if (!url) return

  try {
    await fetch(url, { signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT_MS) })
  } catch {
    // El heartbeat es best-effort: un fallo aqui no debe romper el cron
  }
}
