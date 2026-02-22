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
