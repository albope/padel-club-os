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
      description="Cómo se procesa la suscripción SaaS y cómo se gestionan los cobros presenciales de las reservas."
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
        <h2>2. Cobros de reservas</h2>
        <p className="mt-3">
          Las reservas se pagan directamente en el club por los medios que este acepte. Padel Club OS permite
          registrar el estado del cobro, pero no recibe, procesa ni intermedia en el dinero que el jugador entrega
          por la pista o actividad. El club presta el servicio deportivo, fija el precio, emite el justificante o
          factura que corresponda y aplica sus reglas de cancelación.
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
          suscripción quedan disponibles mediante el portal de facturación de Stripe. El Proveedor emite esas facturas,
          verifica su contenido y las entrega mensualmente a su gestoría para su contabilización.
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
          Las devoluciones de importes cobrados presencialmente por una reserva se solicitan y resuelven directamente
          con el club conforme a su política publicada.
        </p>
        <p className="mt-3">
          Las subidas de plan se aplican inmediatamente y se cobra la diferencia proporcional por el tiempo restante.
          Las bajadas se aplican al comenzar el siguiente periodo mensual, sin devolución del periodo ya pagado.
        </p>
      </section>
    </LegalPage>
  )
}
