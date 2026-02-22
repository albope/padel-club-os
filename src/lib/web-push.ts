import webpush from "web-push"

// Singleton web-push con lazy initialization
// Evita errores en build cuando las VAPID keys no estan definidas
let _configurado = false

function configurarWebPush() {
  if (_configurado) return

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "mailto:contacto@padelclubos.com"

  if (!publicKey || !privateKey) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY son requeridas")
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  _configurado = true
}

export interface PushPayload {
  title: string
  message: string
  url?: string
  tag?: string
}

/** Enviar notificacion push a una suscripcion */
export async function enviarPush(
  suscripcion: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  try {
    configurarWebPush()
    await webpush.sendNotification(
      {
        endpoint: suscripcion.endpoint,
        keys: {
          p256dh: suscripcion.p256dh,
          auth: suscripcion.auth,
        },
      },
      JSON.stringify(payload)
    )
    return true
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode
    // Si la suscripcion ha expirado (410 Gone o 404), devolver false para que se elimine
    if (statusCode === 410 || statusCode === 404) {
      return false
    }
    console.error("[PUSH_SEND_ERROR]", error)
    return false
  }
}

/** Obtener la clave publica VAPID para el cliente */
export function obtenerVapidPublicKey(): string {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!key) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY no configurada")
  return key
}
