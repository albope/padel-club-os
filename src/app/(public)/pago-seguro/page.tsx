import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/LegalPage"
import { getLegalProvider } from "@/lib/legal"
import { LEGAL_LAST_UPDATED, LEGAL_VERSIONS } from "@/lib/legal-versions"

export const metadata: Metadata = {
  title: "Pago seguro",
  description: "Información sobre pagos, suscripciones y facturas en Padel Club OS.",
  alternates: { canonical: "/pago-seguro" },
}

export default function PagoSeguroPage() {
  const provider = getLegalProvider()

  return (
    <LegalPage
      title="Pago seguro y facturación"
      version={LEGAL_VERSIONS.terminos}
      updatedAt={LEGAL_LAST_UPDATED}
      description="Cómo se procesan los pagos de la suscripción SaaS y los pagos de reservas de los clubes."
    >
      <section>
        <h2>1. Suscripciones de clubes</h2>
        <p className="mt-3">
          La suscripción a Padel Club OS se paga mediante una página de pago alojada por Stripe. Padel Club OS
          no recibe ni almacena el número completo de la tarjeta, su código de seguridad ni las credenciales
          bancarias. Stripe puede aplicar autenticación reforzada, como 3D Secure, cuando corresponda.
        </p>
      </section>

      <section>
        <h2>2. Pagos de reservas</h2>
        <p className="mt-3">
          Cuando un club activa el pago online de reservas, el cobro se procesa mediante Stripe Connect. El club
          presta el servicio deportivo, fija el precio y sus reglas de cancelación, y actúa frente al jugador como
          vendedor del servicio. Padel Club OS aporta la infraestructura tecnológica y puede cobrar al club la
          comisión indicada en su plan o acuerdo comercial.
        </p>
      </section>

      <section>
        <h2>3. Comunicaciones seguras</h2>
        <p className="mt-3">
          Las páginas de producción se sirven mediante HTTPS. Nunca solicitaremos por correo la contraseña,
          el código de seguridad de una tarjeta ni una transferencia a una cuenta comunicada de forma inesperada.
          Ante cualquier duda, no completes el pago y contacta por el canal oficial.
        </p>
      </section>

      <section>
        <h2>4. Impuestos y facturas</h2>
        <p className="mt-3">
          Los precios SaaS publicados son importes netos, salvo que se indique expresamente lo contrario. En el
          Checkout se solicitan la razón social, el domicilio de facturación y, cuando esté disponible para el país,
          el identificador fiscal. Los impuestos aplicables se muestran antes de confirmar el pago. Las facturas de
          suscripción quedan disponibles mediante el portal de facturación de Stripe.
        </p>
        <p className="mt-3">
          El club es responsable de facilitar datos fiscales correctos antes de que se emita la factura. Para corregir
          una factura o consultar un cargo, escribe a <a href={`mailto:${provider.email}`}>{provider.email}</a>.
        </p>
      </section>

      <section>
        <h2>5. Reembolsos y cancelaciones</h2>
        <p className="mt-3">
          Las cancelaciones de la suscripción se rigen por las <a href="/terminos">Condiciones del servicio SaaS</a>.
          Los reembolsos de reservas se rigen por la política publicada por cada club. Un comprobante de Stripe no
          modifica por sí mismo esas condiciones contractuales.
        </p>
      </section>
    </LegalPage>
  )
}
