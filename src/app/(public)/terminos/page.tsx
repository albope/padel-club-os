import type { Metadata } from "next"
import { LegalIdentityWarning } from "@/components/legal/LegalIdentity"
import { LegalPage } from "@/components/legal/LegalPage"
import { getLegalProvider } from "@/lib/legal"
import { LEGAL_LAST_UPDATED, LEGAL_VERSIONS } from "@/lib/legal-versions"

export const metadata: Metadata = {
  title: "Condiciones del servicio SaaS",
  description: "Condiciones B2B de contratación y uso de Padel Club OS.",
  alternates: { canonical: "/terminos" },
}

export default function TerminosPage() {
  const provider = getLegalProvider()
  const providerName = provider.legalName || "el titular identificado en el Aviso legal"

  return (
    <LegalPage
      title="Condiciones del servicio SaaS"
      version={LEGAL_VERSIONS.terminos}
      updatedAt={LEGAL_LAST_UPDATED}
      description="Contrato de suscripción dirigido exclusivamente a clubes, empresas y profesionales que actúan en el marco de su actividad."
    >
      <LegalIdentityWarning provider={provider} />

      <section>
        <h2>1. Partes y ámbito B2B</h2>
        <p className="mt-3">
          Estas condiciones regulan el contrato entre <strong>{providerName}</strong>, prestador de Padel Club OS
          (el «Proveedor»), y la persona física o jurídica que contrata el servicio para la gestión profesional de
          un club (el «Cliente»). Los datos completos del Proveedor figuran en el <a href="/aviso-legal">Aviso legal</a>.
        </p>
        <p className="mt-3">
          Quien acepta estas condiciones declara tener capacidad y autorización suficientes para vincular al Cliente.
          El servicio no se ofrece mediante este flujo a consumidores para fines ajenos a una actividad empresarial o profesional.
        </p>
      </section>

      <section>
        <h2>2. Objeto y documentación contractual</h2>
        <p className="mt-3">
          El Proveedor concede al Cliente, durante la vigencia de la suscripción, un derecho limitado, no exclusivo,
          no sublicenciable y no transferible de acceso a la plataforma Padel Club OS conforme al plan contratado.
          Forman parte del contrato estas condiciones, el plan y precio mostrados antes del pago, el{" "}
          <a href="/acuerdo-tratamiento-datos">Acuerdo de tratamiento de datos</a> y, si existe, una propuesta u orden
          de servicio firmada por ambas partes. Esta última prevalecerá únicamente en lo que modifique expresamente.
        </p>
      </section>

      <section>
        <h2>3. Contratación electrónica</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6">
          <li>El Cliente crea una cuenta, configura su club y selecciona un plan.</li>
          <li>Antes de continuar puede revisar el precio, los impuestos estimados y estas condiciones.</li>
          <li>El pago y los datos fiscales se completan en Stripe Checkout.</li>
          <li>La confirmación se muestra en pantalla y se comunica por medios electrónicos.</li>
        </ol>
        <p className="mt-3">
          El Cliente puede corregir sus datos antes de confirmar y actualizar posteriormente sus datos fiscales y
          medio de pago en el portal de facturación. El contrato se formaliza en español. El Proveedor registra la
          fecha y versión de los documentos aceptados; el Cliente puede guardar o imprimir estas páginas desde su navegador.
        </p>
      </section>

      <section>
        <h2>4. Cuenta y usuarios autorizados</h2>
        <p className="mt-3">
          El Cliente facilitará información exacta y mantendrá actualizados sus datos. Es responsable de asignar roles,
          dar de baja accesos que ya no procedan, proteger sus credenciales y comunicar sin demora cualquier uso no
          autorizado. Las acciones de sus administradores y personal se consideran realizadas por el Cliente.
        </p>
      </section>

      <section>
        <h2>5. Prueba, planes, precios e impuestos</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>La prueba gratuita se concede una sola vez por club durante el plazo indicado al registrarse.</li>
          <li>Las funcionalidades y límites son los publicados para el plan seleccionado en el momento de contratar.</li>
          <li>Los precios publicados son netos y no incluyen IVA u otros tributos, salvo indicación expresa.</li>
          <li>La suscripción se factura por periodos mensuales anticipados y se renueva automáticamente.</li>
          <li>Stripe procesa el pago y genera la documentación de facturación con los datos facilitados por el Cliente.</li>
        </ul>
        <p className="mt-3">
          Antes de una subida de precio aplicable a una renovación, el Proveedor lo comunicará con antelación razonable.
          El Cliente podrá cancelar antes de que el nuevo precio entre en vigor.
        </p>
      </section>

      <section>
        <h2>6. Duración, renovación y cancelación</h2>
        <p className="mt-3">
          El contrato comienza cuando el Cliente acepta estas condiciones y continúa mientras exista una prueba o
          suscripción activa. El Cliente puede cancelar desde el portal de facturación; la cancelación ordinaria surte
          efecto al final del periodo ya pagado. Salvo obligación legal o incumplimiento del Proveedor, no se reembolsan
          periodos parciales ni importes correspondientes a tiempo no utilizado.
        </p>
      </section>

      <section>
        <h2>7. Uso permitido y obligaciones del Cliente</h2>
        <p className="mt-3">El Cliente se obliga a:</p>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>usar el servicio de forma lícita y únicamente para su actividad;</li>
          <li>no introducir malware, eludir límites, realizar pruebas intrusivas no autorizadas ni revender accesos;</li>
          <li>no cargar datos que no necesite o para los que carezca de base jurídica;</li>
          <li>informar a jugadores y personal sobre sus tratamientos y atender sus derechos como responsable;</li>
          <li>no utilizar campos libres para categorías especiales de datos salvo acuerdo escrito y medidas específicas.</li>
        </ul>
      </section>

      <section>
        <h2>8. Datos, privacidad y confidencialidad</h2>
        <p className="mt-3">
          El Cliente conserva el control sobre los datos que incorpora. Cuando el Proveedor trata datos de jugadores,
          socios o personal siguiendo instrucciones del Cliente, actúa como encargado conforme al DPA. Cada parte
          mantendrá confidencial la información no pública recibida de la otra y la usará solo para ejecutar el contrato.
        </p>
      </section>

      <section>
        <h2>9. Pagos de reservas y relación con jugadores</h2>
        <p className="mt-3">
          Cuando el Cliente activa Stripe Connect, el Cliente continúa siendo quien ofrece la pista o actividad al
          jugador, fija el precio, emite la factura o justificante que corresponda y define la política de cancelación.
          Padel Club OS facilita la tecnología de cobro y puede percibir una comisión, pero no sustituye al club como
          prestador del servicio deportivo. El Cliente atenderá reclamaciones, devoluciones y obligaciones fiscales de sus ventas.
        </p>
      </section>

      <section>
        <h2>10. Soporte, mantenimiento y disponibilidad</h2>
        <p className="mt-3">
          El soporte se presta por los canales y con la prioridad incluidos en cada plan. El Proveedor aplica medidas
          razonables para mantener la continuidad, pero no garantiza disponibilidad ininterrumpida. Puede realizar
          mantenimiento y adoptar cambios necesarios por seguridad, cumplimiento o evolución técnica, procurando reducir su impacto.
        </p>
      </section>

      <section>
        <h2>11. Servicios de terceros</h2>
        <p className="mt-3">
          Algunas funciones dependen de proveedores como Stripe, servicios de alojamiento, correo o notificaciones.
          Sus interrupciones pueden afectar temporalmente a la plataforma. El Proveedor seleccionará y supervisará a
          quienes traten datos por su cuenta conforme al DPA.
        </p>
      </section>

      <section>
        <h2>12. Propiedad intelectual</h2>
        <p className="mt-3">
          El Proveedor y sus licenciantes conservan todos los derechos sobre la plataforma, su código, diseño,
          documentación y marca. El Cliente conserva sus datos y contenidos. Si facilita sugerencias, autoriza al
          Proveedor a utilizarlas sin revelar información confidencial ni datos personales.
        </p>
      </section>

      <section>
        <h2>13. Suspensión y terminación</h2>
        <p className="mt-3">
          El Proveedor puede suspender el acceso cuando exista impago, riesgo de seguridad, uso ilícito o incumplimiento
          material, limitando la medida a lo necesario y avisando cuando sea razonablemente posible. Antes de una
          terminación por incumplimiento subsanable se concederá un plazo razonable para corregirlo.
        </p>
        <p className="mt-3">
          Tras finalizar el contrato, el Cliente debe exportar la información que necesite. El destino de los datos
          personales se regula en el DPA, sin perjuicio de bloqueos o conservación exigidos legalmente.
        </p>
      </section>

      <section>
        <h2>14. Garantías y responsabilidad</h2>
        <p className="mt-3">
          El Proveedor prestará el servicio con diligencia profesional y corregirá incidencias reproducibles en un plazo
          razonable según su gravedad. En la máxima medida permitida en relaciones B2B, ninguna parte responderá por lucro
          cesante o daños indirectos imprevisibles. La responsabilidad agregada del Proveedor derivada del contrato no
          excederá de las cuotas SaaS pagadas por el Cliente en los doce meses anteriores al hecho causante.
        </p>
        <p className="mt-3">
          Los límites no se aplican a dolo, culpa grave, vulneraciones de confidencialidad o protección de datos imputables
          a la parte responsable, ni a responsabilidades que la ley no permita excluir o limitar.
        </p>
      </section>

      <section>
        <h2>15. Modificaciones</h2>
        <p className="mt-3">
          Los cambios materiales se comunicarán antes de su entrada en vigor. Si afectan de forma sustancial a derechos
          u obligaciones vigentes, se solicitará aceptación o se permitirá cancelar antes de la siguiente renovación.
          Las modificaciones exigidas por ley o necesarias ante un riesgo urgente podrán aplicarse de inmediato, explicando el motivo.
        </p>
      </section>

      <section>
        <h2>16. Ley aplicable, comunicaciones y jurisdicción</h2>
        <p className="mt-3">
          El contrato se rige por la legislación española. Las comunicaciones operativas se enviarán al correo del
          administrador del Cliente y las dirigidas al Proveedor a <a href={`mailto:${provider.email}`}>{provider.email}</a>.
          Las partes intentarán resolver de buena fe cualquier controversia. Si no fuera posible, se someten a los
          juzgados y tribunales que resulten competentes conforme a la normativa procesal aplicable a relaciones entre empresas.
        </p>
      </section>
    </LegalPage>
  )
}
