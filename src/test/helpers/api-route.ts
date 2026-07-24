/**
 * Helpers para invocar API route handlers en tests de integracion.
 */

interface CrearRequestOpciones {
  method?: string
  body?: unknown
  url?: string
  headers?: Record<string, string>
}

/** Crea un Request para pasar a route handlers */
export function crearRequest({
  method = "POST",
  body,
  url = "http://localhost/api/test",
  headers = {},
}: CrearRequestOpciones = {}): Request {
  const init: RequestInit = { method, headers: { ...headers } }

  if (body !== undefined) {
    init.body = JSON.stringify(body)
    ;(init.headers as Record<string, string>)["Content-Type"] = "application/json"
  }

  return new Request(url, init)
}

/** Crea params como Promise (para routes que hacen `await params`, ej: reschedule) */
export function crearParams<T extends Record<string, string>>(obj: T): { params: Promise<T> } {
  return { params: Promise.resolve(obj) }
}

/** Crea el contexto asincrono de params exigido por Route Handlers en Next 15. */
export function crearParamsPlano<T extends Record<string, string>>(obj: T): { params: Promise<T> } {
  return { params: Promise.resolve(obj) }
}

/** Extrae el JSON de un Response */
export async function extraerJson(response: Response): Promise<unknown> {
  return response.json()
}
