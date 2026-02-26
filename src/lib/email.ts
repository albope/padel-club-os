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

// =============================================================================
// CONSTANTES DE MARCA
// =============================================================================

const EMAIL_FROM = "Padel Club OS <onboarding@resend.dev>"

const EMAIL_BRAND = {
  nombre: "Padel Club OS",
  colorPrimario: "#3b82f6",
  colorSecundario: "#06b6d4",
  colorBotonHover: "#2563eb",
  colorTexto: "#1a1a1a",
  colorTextoSecundario: "#6b7280",
  colorTextoTerciario: "#94a3b8",
  colorFondo: "#f8fafc",
  colorFondoContenido: "#ffffff",
  colorBorde: "#e2e8f0",
  colorBordeDetalle: "#3b82f6",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://padelclubos.com",
  anio: new Date().getFullYear(),
} as const

// Logo SVG inline (pista de padel) — replica de logo-icon.tsx para emails
const LOGO_SVG_EMAIL = `<div style="width:36px;height:36px;min-width:36px;border-radius:10px;background:linear-gradient(135deg,hsl(217,91%,52%) 0%,hsl(197,85%,48%) 100%);display:inline-block;vertical-align:middle;text-align:center;line-height:36px;">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-top:9px;">
    <rect x="4" y="2" width="16" height="20" rx="1.5" stroke="white" stroke-width="1.5" opacity="0.95"/>
    <line x1="4" y1="12" x2="20" y2="12" stroke="white" stroke-width="1.5" opacity="0.95"/>
    <line x1="12" y1="2" x2="12" y2="12" stroke="white" stroke-width="1" opacity="0.45"/>
    <line x1="4" y1="7.5" x2="20" y2="7.5" stroke="white" stroke-width="1" opacity="0.35"/>
    <line x1="12" y1="12" x2="12" y2="22" stroke="white" stroke-width="1" opacity="0.45"/>
    <line x1="4" y1="16.5" x2="20" y2="16.5" stroke="white" stroke-width="1" opacity="0.35"/>
  </svg>
</div>`

// =============================================================================
// HELPERS
// =============================================================================

/** Escapar HTML para prevenir XSS en datos de usuario */
function escaparHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Genera un bloque HTML tipo "ficha" con borde azul izquierdo para detalles de reserva */
function cajaDetalle(detalles: { etiqueta: string; valor: string }[]): string {
  const filas = detalles
    .map(
      (d) => `
      <tr>
        <td style="padding:6px 12px 6px 0;font-size:13px;color:${EMAIL_BRAND.colorTextoSecundario};white-space:nowrap;vertical-align:top;">${d.etiqueta}</td>
        <td style="padding:6px 0;font-size:14px;color:${EMAIL_BRAND.colorTexto};font-weight:600;">${d.valor}</td>
      </tr>`
    )
    .join("")

  return `
    <div style="border-left:4px solid ${EMAIL_BRAND.colorBordeDetalle};background-color:${EMAIL_BRAND.colorFondo};border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${filas}
      </table>
    </div>`
}

/** Formatear fecha en espanol */
function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  })
}

/** Formatear hora en espanol */
function formatearHora(fecha: Date): string {
  return fecha.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  })
}

/** Calcular duracion en minutos entre dos fechas */
function calcularDuracionMin(inicio: Date, fin: Date): number {
  return Math.round((fin.getTime() - inicio.getTime()) / 60000)
}

/** Traducir estado de pago */
function traducirEstadoPago(estado: string): string {
  switch (estado) {
    case "paid":
      return "Pagado"
    case "exempt":
      return "Pago presencial"
    case "pending":
      return "Pendiente de pago"
    default:
      return estado
  }
}

// =============================================================================
// PLANTILLA BASE
// =============================================================================

interface PlantillaEmailParams {
  titulo: string
  preheader?: string
  contenido: string
  boton?: { texto: string; url: string }
  pieDePagina?: string
}

function plantillaEmail({ titulo, preheader, contenido, boton, pieDePagina }: PlantillaEmailParams): string {
  const preheaderHtml = preheader
    ? `<span style="display:none;font-size:1px;color:${EMAIL_BRAND.colorFondo};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>`
    : ""

  const botonHtml = boton
    ? `<div style="text-align:center;margin:28px 0 8px;">
        <a href="${boton.url}" style="display:inline-block;background:linear-gradient(135deg,${EMAIL_BRAND.colorPrimario},${EMAIL_BRAND.colorBotonHover});color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;line-height:1;">
          ${boton.texto}
        </a>
      </div>`
    : ""

  const pieDePaginaHtml = pieDePagina
    ? `<p style="margin:12px 0 0;font-size:11px;color:${EMAIL_BRAND.colorTextoTerciario};text-align:center;line-height:1.5;">${pieDePagina}</p>`
    : ""

  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BRAND.colorFondo};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheaderHtml}

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${EMAIL_BRAND.colorFondo};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Contenedor principal -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,${EMAIL_BRAND.colorPrimario} 0%,${EMAIL_BRAND.colorSecundario} 100%);padding:20px 32px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    ${LOGO_SVG_EMAIL}
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">${EMAIL_BRAND.nombre}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:${EMAIL_BRAND.colorFondoContenido};padding:32px;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${EMAIL_BRAND.colorTexto};line-height:1.3;">
                ${titulo}
              </h1>
              ${contenido}
              ${botonHtml}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:${EMAIL_BRAND.colorFondo};padding:24px 32px;border-top:1px solid ${EMAIL_BRAND.colorBorde};">
              <p style="margin:0;font-size:12px;color:${EMAIL_BRAND.colorTextoTerciario};text-align:center;line-height:1.6;">
                &copy; ${EMAIL_BRAND.anio} ${EMAIL_BRAND.nombre}. Todos los derechos reservados.<br />
                <a href="${EMAIL_BRAND.siteUrl}/privacidad" style="color:${EMAIL_BRAND.colorTextoTerciario};text-decoration:underline;">Privacidad</a>
                &nbsp;&middot;&nbsp;
                <a href="${EMAIL_BRAND.siteUrl}/terminos" style="color:${EMAIL_BRAND.colorTextoTerciario};text-decoration:underline;">Terminos</a>
              </p>
              ${pieDePaginaHtml}
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

// =============================================================================
// ESTILOS REUTILIZABLES
// =============================================================================

const estiloParrafo = `color:${EMAIL_BRAND.colorTexto};font-size:15px;line-height:1.6;margin:0 0 16px;`
const estiloParrafoSecundario = `color:${EMAIL_BRAND.colorTextoSecundario};font-size:13px;line-height:1.5;margin:0 0 8px;`
const estiloListaItem = `color:${EMAIL_BRAND.colorTexto};font-size:14px;line-height:1.6;margin:0 0 8px;padding-left:4px;`

// =============================================================================
// EMAILS TRANSACCIONALES
// =============================================================================

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
  const saludo = nombre ? escaparHtml(nombre) : null

  const contenido = `
    <p style="${estiloParrafo}">
      ${saludo ? `Hola ${saludo},` : "Hola,"}
    </p>
    <p style="${estiloParrafo}">
      Hemos recibido una solicitud para restablecer la contrase&ntilde;a de tu cuenta en ${EMAIL_BRAND.nombre}.
    </p>
    <p style="${estiloParrafo}">
      Haz clic en el bot&oacute;n de abajo para crear una nueva contrase&ntilde;a:
    </p>
    <p style="${estiloParrafoSecundario}">
      Este enlace expira en <strong>1 hora</strong>.
      Si no solicitaste este cambio, puedes ignorar este email.
    </p>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid ${EMAIL_BRAND.colorBorde};">
      <p style="color:${EMAIL_BRAND.colorTextoTerciario};font-size:12px;margin:0;">
        Si el bot&oacute;n no funciona, copia este enlace en tu navegador:<br />
        <a href="${resetUrl}" style="color:${EMAIL_BRAND.colorPrimario};word-break:break-all;">${resetUrl}</a>
      </p>
    </div>
  `

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Recupera tu contrase\u00f1a - ${EMAIL_BRAND.nombre}`,
    html: plantillaEmail({
      titulo: "Restablecer contrase\u00f1a",
      preheader: "Instrucciones para restablecer tu contrase\u00f1a en Padel Club OS",
      contenido,
      boton: { texto: "Restablecer contrase\u00f1a", url: resetUrl },
    }),
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

  const contenido = `
    <p style="${estiloParrafo}">
      Se ha recibido un nuevo mensaje desde el formulario de contacto.
    </p>
    ${cajaDetalle([
      { etiqueta: "Nombre", valor: escaparHtml(nombre) },
      { etiqueta: "Email", valor: escaparHtml(email) },
      { etiqueta: "Asunto", valor: escaparHtml(asunto) },
    ])}
    <div style="background-color:${EMAIL_BRAND.colorFondo};border-radius:8px;padding:16px 20px;margin:16px 0;">
      <p style="font-size:13px;color:${EMAIL_BRAND.colorTextoSecundario};margin:0 0 8px;font-weight:600;">Mensaje:</p>
      <p style="font-size:14px;color:${EMAIL_BRAND.colorTexto};margin:0;line-height:1.6;white-space:pre-wrap;">${escaparHtml(mensaje)}</p>
    </div>
  `

  await resend.emails.send({
    from: EMAIL_FROM,
    to: destinatario,
    replyTo: email,
    subject: `[Contacto] ${asunto} - ${nombre}`,
    html: plantillaEmail({
      titulo: "Nuevo mensaje de contacto",
      preheader: `Mensaje de ${nombre}: ${asunto}`,
      contenido,
    }),
  })
}

// --- Email de bienvenida admin ---

interface EnviarEmailBienvenidaAdminParams {
  email: string
  nombre: string
  clubNombre: string
  clubSlug: string
  trialEndsAt: Date
}

export async function enviarEmailBienvenidaAdmin({
  email,
  nombre,
  clubNombre,
  clubSlug,
  trialEndsAt,
}: EnviarEmailBienvenidaAdminParams) {
  const resend = getResend()
  const nombreSeguro = escaparHtml(nombre)
  const clubSeguro = escaparHtml(clubNombre)
  const fechaTrial = formatearFecha(trialEndsAt)
  const dashboardUrl = `${EMAIL_BRAND.siteUrl}/dashboard`

  const contenido = `
    <p style="${estiloParrafo}">
      Hola ${nombreSeguro},
    </p>
    <p style="${estiloParrafo}">
      &iexcl;Tu club <strong>${clubSeguro}</strong> ha sido creado con &eacute;xito! Ya puedes empezar a gestionar tu club de p&aacute;del desde el panel de administraci&oacute;n.
    </p>
    ${cajaDetalle([
      { etiqueta: "Club", valor: clubSeguro },
      { etiqueta: "Prueba gratuita", valor: `14 d&iacute;as (hasta el ${fechaTrial})` },
      { etiqueta: "Portal", valor: `${EMAIL_BRAND.siteUrl}/club/${escaparHtml(clubSlug)}` },
    ])}
    <p style="${estiloParrafo}">
      <strong>Primeros pasos:</strong>
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px;">
      <tr>
        <td style="${estiloListaItem}">1. &nbsp;Configura tus pistas y horarios</td>
      </tr>
      <tr>
        <td style="${estiloListaItem}">2. &nbsp;Establece precios por franja horaria</td>
      </tr>
      <tr>
        <td style="${estiloListaItem}">3. &nbsp;Invita a tus socios a registrarse</td>
      </tr>
    </table>
  `

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Bienvenido a ${EMAIL_BRAND.nombre} - Tu club est\u00e1 listo`,
    html: plantillaEmail({
      titulo: `Bienvenido a ${EMAIL_BRAND.nombre}`,
      preheader: `Tu club ${clubNombre} ha sido creado. Tienes 14 dias de prueba gratuita.`,
      contenido,
      boton: { texto: "Acceder al panel", url: dashboardUrl },
    }),
  })
}

// --- Email de bienvenida jugador ---

interface EnviarEmailBienvenidaJugadorParams {
  email: string
  nombre: string
  clubNombre: string
  clubSlug: string
}

export async function enviarEmailBienvenidaJugador({
  email,
  nombre,
  clubNombre,
  clubSlug,
}: EnviarEmailBienvenidaJugadorParams) {
  const resend = getResend()
  const nombreSeguro = escaparHtml(nombre)
  const clubSeguro = escaparHtml(clubNombre)
  const clubUrl = `${EMAIL_BRAND.siteUrl}/club/${escaparHtml(clubSlug)}`

  const contenido = `
    <p style="${estiloParrafo}">
      Hola ${nombreSeguro},
    </p>
    <p style="${estiloParrafo}">
      &iexcl;Ya formas parte de <strong>${clubSeguro}</strong>! Desde ahora puedes acceder a todas las funcionalidades del club.
    </p>
    <p style="${estiloParrafo}">
      <strong>&iquest;Qu&eacute; puedes hacer?</strong>
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px;">
      <tr>
        <td style="${estiloListaItem}">&bull; &nbsp;Reservar pistas online</td>
      </tr>
      <tr>
        <td style="${estiloListaItem}">&bull; &nbsp;Unirte a partidas abiertas</td>
      </tr>
      <tr>
        <td style="${estiloListaItem}">&bull; &nbsp;Consultar competiciones y rankings</td>
      </tr>
      <tr>
        <td style="${estiloListaItem}">&bull; &nbsp;Recibir noticias y notificaciones</td>
      </tr>
    </table>
  `

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Bienvenido a ${clubNombre} - ${EMAIL_BRAND.nombre}`,
    html: plantillaEmail({
      titulo: `Bienvenido a ${clubSeguro}`,
      preheader: `Ya formas parte de ${clubNombre}. Reserva pistas, busca partidas y mucho mas.`,
      contenido,
      boton: { texto: "Ir al club", url: clubUrl },
    }),
  })
}

// --- Email de confirmacion de reserva ---

interface EnviarEmailConfirmacionReservaParams {
  email: string
  nombre: string
  pistaNombre: string
  fechaHoraInicio: Date
  fechaHoraFin: Date
  precioTotal: number
  estadoPago: string
  clubNombre: string
  clubSlug: string
}

export async function enviarEmailConfirmacionReserva({
  email,
  nombre,
  pistaNombre,
  fechaHoraInicio,
  fechaHoraFin,
  precioTotal,
  estadoPago,
  clubNombre,
  clubSlug,
}: EnviarEmailConfirmacionReservaParams) {
  const resend = getResend()
  const nombreSeguro = escaparHtml(nombre)
  const pistaSegura = escaparHtml(pistaNombre)
  const clubSeguro = escaparHtml(clubNombre)
  const fecha = formatearFecha(fechaHoraInicio)
  const horaInicio = formatearHora(fechaHoraInicio)
  const horaFin = formatearHora(fechaHoraFin)
  const duracion = calcularDuracionMin(fechaHoraInicio, fechaHoraFin)
  const reservasUrl = `${EMAIL_BRAND.siteUrl}/club/${escaparHtml(clubSlug)}/reservar`

  const contenido = `
    <p style="${estiloParrafo}">
      Hola ${nombreSeguro},
    </p>
    <p style="${estiloParrafo}">
      Tu reserva en <strong>${clubSeguro}</strong> ha sido confirmada.
    </p>
    ${cajaDetalle([
      { etiqueta: "Pista", valor: pistaSegura },
      { etiqueta: "Fecha", valor: fecha.charAt(0).toUpperCase() + fecha.slice(1) },
      { etiqueta: "Horario", valor: `${horaInicio} - ${horaFin} (${duracion} min)` },
      { etiqueta: "Precio", valor: `${precioTotal.toFixed(2)} &euro;` },
      { etiqueta: "Pago", valor: traducirEstadoPago(estadoPago) },
    ])}
    <p style="${estiloParrafoSecundario}">
      &iexcl;Nos vemos en la pista!
    </p>
  `

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Reserva confirmada - ${pistaNombre}`,
    html: plantillaEmail({
      titulo: "Reserva confirmada",
      preheader: `Tu reserva en ${pistaNombre} para el ${fecha} a las ${horaInicio} ha sido confirmada.`,
      contenido,
      boton: { texto: "Ver mis reservas", url: reservasUrl },
      pieDePagina: "Puedes cancelar tu reserva desde tu perfil respetando la pol&iacute;tica de cancelaci&oacute;n del club.",
    }),
  })
}

// --- Email de cancelacion de reserva ---

interface EnviarEmailCancelacionReservaParams {
  email: string
  nombre: string
  pistaNombre: string
  fechaHoraInicio: Date
  precioTotal: number
  clubNombre: string
  clubSlug: string
}

export async function enviarEmailCancelacionReserva({
  email,
  nombre,
  pistaNombre,
  fechaHoraInicio,
  precioTotal,
  clubNombre,
  clubSlug,
}: EnviarEmailCancelacionReservaParams) {
  const resend = getResend()
  const nombreSeguro = escaparHtml(nombre)
  const pistaSegura = escaparHtml(pistaNombre)
  const clubSeguro = escaparHtml(clubNombre)
  const fecha = formatearFecha(fechaHoraInicio)
  const hora = formatearHora(fechaHoraInicio)
  const reservasUrl = `${EMAIL_BRAND.siteUrl}/club/${escaparHtml(clubSlug)}/reservar`

  const contenido = `
    <p style="${estiloParrafo}">
      Hola ${nombreSeguro},
    </p>
    <p style="${estiloParrafo}">
      Tu reserva en <strong>${clubSeguro}</strong> ha sido cancelada correctamente.
    </p>
    <div style="border-left:4px solid ${EMAIL_BRAND.colorBorde};background-color:${EMAIL_BRAND.colorFondo};border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;opacity:0.75;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="padding:4px 12px 4px 0;font-size:13px;color:${EMAIL_BRAND.colorTextoSecundario};">Pista</td>
          <td style="padding:4px 0;font-size:14px;color:${EMAIL_BRAND.colorTextoSecundario};text-decoration:line-through;">${pistaSegura}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px 4px 0;font-size:13px;color:${EMAIL_BRAND.colorTextoSecundario};">Fecha</td>
          <td style="padding:4px 0;font-size:14px;color:${EMAIL_BRAND.colorTextoSecundario};text-decoration:line-through;">${fecha.charAt(0).toUpperCase() + fecha.slice(1)}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px 4px 0;font-size:13px;color:${EMAIL_BRAND.colorTextoSecundario};">Hora</td>
          <td style="padding:4px 0;font-size:14px;color:${EMAIL_BRAND.colorTextoSecundario};text-decoration:line-through;">${hora}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px 4px 0;font-size:13px;color:${EMAIL_BRAND.colorTextoSecundario};">Precio</td>
          <td style="padding:4px 0;font-size:14px;color:${EMAIL_BRAND.colorTextoSecundario};text-decoration:line-through;">${precioTotal.toFixed(2)} &euro;</td>
        </tr>
      </table>
    </div>
    <p style="${estiloParrafoSecundario}">
      Si deseas, puedes hacer una nueva reserva en cualquier momento.
    </p>
  `

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Reserva cancelada - ${pistaNombre}`,
    html: plantillaEmail({
      titulo: "Reserva cancelada",
      preheader: `Tu reserva en ${pistaNombre} para el ${fecha} ha sido cancelada.`,
      contenido,
      boton: { texto: "Reservar de nuevo", url: reservasUrl },
    }),
  })
}

// --- Email de recordatorio de reserva ---

interface EnviarEmailRecordatorioReservaParams {
  email: string
  nombre: string
  pistaNombre: string
  fechaHoraInicio: Date
  clubNombre: string
  clubSlug: string
}

export async function enviarEmailRecordatorioReserva({
  email,
  nombre,
  pistaNombre,
  fechaHoraInicio,
  clubNombre,
  clubSlug,
}: EnviarEmailRecordatorioReservaParams) {
  const resend = getResend()
  const nombreSeguro = escaparHtml(nombre)
  const pistaSegura = escaparHtml(pistaNombre)
  const clubSeguro = escaparHtml(clubNombre)
  const hora = formatearHora(fechaHoraInicio)
  const reservasUrl = `${EMAIL_BRAND.siteUrl}/club/${escaparHtml(clubSlug)}/reservar`

  const contenido = `
    <p style="${estiloParrafo}">
      Hola ${nombreSeguro},
    </p>
    <p style="${estiloParrafo}">
      &iexcl;Tu reserva en <strong>${clubSeguro}</strong> es dentro de 1 hora!
    </p>
    ${cajaDetalle([
      { etiqueta: "Pista", valor: pistaSegura },
      { etiqueta: "Hora", valor: hora },
    ])}
    <p style="${estiloParrafo}">
      &iexcl;No llegues tarde! Recuerda llevar tu pala y calzado adecuado.
    </p>
  `

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Recordatorio: ${pistaNombre} hoy a las ${hora}`,
    html: plantillaEmail({
      titulo: "Recordatorio de reserva",
      preheader: `Tu reserva en ${pistaNombre} es hoy a las ${hora}. No llegues tarde!`,
      contenido,
      boton: { texto: "Ver mi reserva", url: reservasUrl },
    }),
  })
}
