import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/LegalPage"
import { getLegalProvider } from "@/lib/legal"
import { LEGAL_LAST_UPDATED, LEGAL_VERSIONS } from "@/lib/legal-versions"

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Cookies y tecnologías de almacenamiento utilizadas por Padel Club OS.",
  alternates: { canonical: "/cookies" },
}

export default function CookiesPage() {
  const provider = getLegalProvider()

  return (
    <LegalPage
      title="Política de cookies"
      version={LEGAL_VERSIONS.cookies}
      updatedAt={LEGAL_LAST_UPDATED}
      description="Información sobre cookies, almacenamiento local y tecnologías equivalentes utilizadas en el sitio y la aplicación."
    >
      <section>
        <h2>1. Responsable</h2>
        <p className="mt-3">
          El responsable de las tecnologías propias de Padel Club OS es {provider.legalName || "el titular identificado en el Aviso legal"}.
          Puedes escribir a <a href={`mailto:${provider.email}`}>{provider.email}</a>.
        </p>
      </section>

      <section>
        <h2>2. Qué son estas tecnologías</h2>
        <p className="mt-3">
          Las cookies son pequeños archivos que el navegador guarda para mantener una sesión o recordar preferencias.
          También usamos almacenamiento local del navegador y un service worker para funciones equivalentes, como
          recordar el idioma, conservar la elección informativa sobre cookies y permitir funciones de la aplicación web progresiva.
        </p>
      </section>

      <section>
        <h2>3. Tecnologías utilizadas actualmente</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead><tr className="border-b"><th className="p-3">Nombre o categoría</th><th className="p-3">Proveedor</th><th className="p-3">Finalidad</th><th className="p-3">Duración orientativa</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="p-3"><code>next-auth.session-token</code> o variante segura</td><td className="p-3">Padel Club OS</td><td className="p-3">Mantener la sesión autenticada y proteger áreas privadas</td><td className="p-3">Sesión o hasta 30 días, según la opción de acceso</td></tr>
              <tr className="border-b"><td className="p-3">Cookies auxiliares de autenticación</td><td className="p-3">Padel Club OS</td><td className="p-3">Seguridad CSRF, retorno tras iniciar sesión y control del flujo de acceso</td><td className="p-3">Normalmente, sesión o pocos minutos</td></tr>
              <tr className="border-b"><td className="p-3"><code>NEXT_LOCALE</code></td><td className="p-3">Padel Club OS</td><td className="p-3">Recordar el idioma elegido</td><td className="p-3">Hasta que se sustituye o elimina</td></tr>
              <tr className="border-b"><td className="p-3"><code>padel-cookie-consent</code> (localStorage)</td><td className="p-3">Padel Club OS</td><td className="p-3">Recordar que se mostró la información sobre cookies</td><td className="p-3">Hasta que se borra el almacenamiento del sitio</td></tr>
              <tr><td className="p-3">Caché del service worker</td><td className="p-3">Padel Club OS</td><td className="p-3">Carga, actualización y funcionamiento de la PWA</td><td className="p-3">Hasta actualización o borrado de datos del sitio</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Estas tecnologías son necesarias para prestar las funciones solicitadas o recordar una preferencia y no se
          utilizan para publicidad comportamental. El registro de que se mostró el aviso puede incluir fecha, tipo de
          elección, agente de usuario e IP anonimizada con fines de trazabilidad.
        </p>
      </section>

      <section>
        <h2>4. Servicios de terceros</h2>
        <p className="mt-3">
          Al acceder a la página de pago o al portal de facturación, el navegador pasa a un dominio de Stripe, que
          puede usar sus propias tecnologías necesarias para procesar pagos, prevenir fraude y cumplir obligaciones.
          Consulta la <a href="https://stripe.com/es/privacy" target="_blank" rel="noopener noreferrer">información de privacidad de Stripe</a>.
          La monitorización técnica de errores puede recibir información del navegador, pero no se utiliza para crear perfiles publicitarios.
        </p>
      </section>

      <section>
        <h2>5. Cómo gestionarlas</h2>
        <p className="mt-3">
          Puedes borrar o bloquear cookies desde la configuración del navegador y eliminar los datos almacenados para
          este sitio. Bloquear las tecnologías necesarias puede impedir iniciar sesión, conservar preferencias o usar
          correctamente la aplicación. Si en el futuro incorporamos cookies analíticas o publicitarias, se bloquearán
          hasta obtener la elección correspondiente y se actualizará esta política.
        </p>
      </section>

      <section>
        <h2>6. Más información</h2>
        <p className="mt-3">
          El tratamiento de datos asociado se explica en la <a href="/privacidad">Política de privacidad</a>. Para
          consultas sobre estas tecnologías, contacta en <a href={`mailto:${provider.email}`}>{provider.email}</a>.
        </p>
      </section>
    </LegalPage>
  )
}
