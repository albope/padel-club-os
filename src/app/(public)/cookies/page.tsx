import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Politica de Cookies | Padel Club OS",
  description: "Politica de cookies de Padel Club OS. Informacion sobre el uso de cookies en nuestra plataforma.",
}

export default function CookiesPage() {
  return (
    <div className="container max-w-3xl py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Politica de Cookies
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ultima actualizacion: 21 de febrero de 2026
      </p>

      <div className="mt-10 space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Que son las cookies</h2>
          <p className="mt-3">
            Las cookies son pequenos archivos de texto que se almacenan en tu dispositivo (ordenador,
            tablet o movil) cuando visitas un sitio web. Las cookies permiten que el sitio reconozca
            tu dispositivo y recuerde informacion sobre tu visita, como tus preferencias o tu estado
            de sesion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Cookies que utilizamos</h2>
          <p className="mt-3">
            En Padel Club OS utilizamos los siguientes tipos de cookies:
          </p>

          <div className="mt-4 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Cookie</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Duracion</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Finalidad</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">next-auth.session-token</td>
                  <td className="px-4 py-3">Esencial</td>
                  <td className="px-4 py-3">Sesion</td>
                  <td className="px-4 py-3">Mantener tu sesion iniciada de forma segura.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">next-auth.csrf-token</td>
                  <td className="px-4 py-3">Esencial</td>
                  <td className="px-4 py-3">Sesion</td>
                  <td className="px-4 py-3">Proteccion contra ataques CSRF (falsificacion de solicitudes).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">next-auth.callback-url</td>
                  <td className="px-4 py-3">Esencial</td>
                  <td className="px-4 py-3">Sesion</td>
                  <td className="px-4 py-3">Redirigirte a la pagina correcta tras iniciar sesion.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">theme</td>
                  <td className="px-4 py-3">Funcional</td>
                  <td className="px-4 py-3">1 ano</td>
                  <td className="px-4 py-3">Recordar tu preferencia de tema (claro/oscuro).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Tipos de cookies por finalidad</h2>

          <h3 className="mt-4 text-lg font-medium text-foreground">Cookies esenciales</h3>
          <p className="mt-2">
            Son estrictamente necesarias para el funcionamiento de la Plataforma. Sin ellas, no
            podrias iniciar sesion ni utilizar las funcionalidades basicas. No requieren tu
            consentimiento ya que son imprescindibles para el servicio.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">Cookies funcionales</h3>
          <p className="mt-2">
            Permiten recordar tus preferencias (como el tema visual) para ofrecerte una experiencia
            personalizada. No son imprescindibles, pero mejoran tu experiencia de uso.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">Cookies analiticas</h3>
          <p className="mt-2">
            Actualmente no utilizamos cookies analiticas de terceros. Si en el futuro incorporamos
            herramientas de analisis, actualizaremos esta politica y solicitaremos tu consentimiento
            previo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Cookies de terceros</h2>
          <p className="mt-3">
            Cuando utilizas funcionalidades de pago, Stripe puede establecer sus propias cookies para
            procesar la transaccion de forma segura y prevenir el fraude. Estas cookies estan sujetas
            a la{" "}
            <a href="https://stripe.com/es/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              politica de privacidad de Stripe
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Como gestionar las cookies</h2>
          <p className="mt-3">
            Puedes gestionar las cookies a traves de la configuracion de tu navegador:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">Chrome:</strong> Configuracion &gt; Privacidad y
              seguridad &gt; Cookies y otros datos de sitios.
            </li>
            <li>
              <strong className="text-foreground">Firefox:</strong> Configuracion &gt; Privacidad y
              seguridad &gt; Cookies y datos del sitio.
            </li>
            <li>
              <strong className="text-foreground">Safari:</strong> Preferencias &gt; Privacidad &gt;
              Gestionar datos de sitios web.
            </li>
            <li>
              <strong className="text-foreground">Edge:</strong> Configuracion &gt; Cookies y
              permisos del sitio &gt; Cookies y datos almacenados.
            </li>
          </ul>
          <p className="mt-3">
            Ten en cuenta que bloquear las cookies esenciales puede impedir el correcto funcionamiento
            de la Plataforma, incluyendo la imposibilidad de iniciar sesion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Actualizaciones de esta politica</h2>
          <p className="mt-3">
            Podemos actualizar esta politica de cookies para reflejar cambios en las cookies que
            utilizamos o por motivos legales. Te recomendamos revisar esta pagina periodicamente.
            Cualquier cambio significativo sera notificado a traves de la Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Mas informacion</h2>
          <p className="mt-3">
            Para mas informacion sobre como tratamos tus datos personales, consulta nuestra{" "}
            <Link href="/privacidad" className="text-primary hover:underline">
              Politica de Privacidad
            </Link>.
          </p>
          <p className="mt-3">
            Si tienes preguntas sobre nuestra politica de cookies, contactanos en{" "}
            <a href="mailto:contacto@padelclubos.com" className="text-primary hover:underline">
              contacto@padelclubos.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
