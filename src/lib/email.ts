import { Resend } from "resend"

// Cliente Resend singleton con lazy initialization
// Evita errores en build cuando RESEND_API_KEY no esta definida
let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error("RESEND_API_KEY no esta configurada")
    }
    _resend = new Resend(apiKey)
  }
  return _resend
}

// --- Email de recuperacion de contrasena ---

interface EnviarEmailResetPasswordParams {
  email: string
  token: string
  nombre?: string | null
  redirectUrl?: string
}

export async function enviarEmailResetPassword({
  email,
  token,
  nombre,
  redirectUrl,
}: EnviarEmailResetPasswordParams) {
  const resend = getResend()
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const resetParams = new URLSearchParams({ token })
  if (redirectUrl) resetParams.set("redirect", redirectUrl)
  const resetUrl = `${baseUrl}/reset-password?${resetParams.toString()}`
  const saludo = nombre ? `Hola ${nombre}` : "Hola"

  await resend.emails.send({
    from: "Padel Club OS <onboarding@resend.dev>",
    to: email,
    subject: "Recupera tu contrasena - Padel Club OS",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">${saludo},</h2>
        <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
          Hemos recibido una solicitud para restablecer la contrasena de tu cuenta en Padel Club OS.
        </p>
        <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Haz clic en el boton para crear una nueva contrasena:
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a
            href="${resetUrl}"
            style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;"
          >
            Restablecer contrasena
          </a>
        </div>
        <p style="color: #6b6b6b; font-size: 13px; line-height: 1.5; margin-bottom: 4px;">
          Este enlace expira en <strong>1 hora</strong>.
        </p>
        <p style="color: #6b6b6b; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
          Si no solicitaste este cambio, puedes ignorar este email. Tu contrasena no sera modificada.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
        <p style="color: #9a9a9a; font-size: 12px;">
          Si el boton no funciona, copia este enlace en tu navegador:<br />
          <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    `,
  })
}

// --- Email de contacto ---

interface EnviarEmailContactoParams {
  nombre: string
  email: string
  asunto: string
  mensaje: string
}

export async function enviarEmailContacto({
  nombre,
  email,
  asunto,
  mensaje,
}: EnviarEmailContactoParams) {
  const resend = getResend()
  const destinatario = process.env.CONTACT_EMAIL || "contacto@padelclubos.com"

  await resend.emails.send({
    from: "Padel Club OS <onboarding@resend.dev>",
    to: destinatario,
    replyTo: email,
    subject: `[Contacto] ${asunto} - ${nombre}`,
    html: `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Asunto:</strong> ${asunto}</p>
      <hr />
      <p><strong>Mensaje:</strong></p>
      <p>${mensaje.replace(/\n/g, "<br />")}</p>
    `,
  })
}
