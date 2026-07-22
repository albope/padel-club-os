import type { Metadata } from "next"
import { LegalIdentityDetails, LegalIdentityWarning } from "@/components/legal/LegalIdentity"
import { LegalPage } from "@/components/legal/LegalPage"
import { getLegalProvider } from "@/lib/legal"
import { LEGAL_LAST_UPDATED, LEGAL_VERSIONS } from "@/lib/legal-versions"

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Información sobre el tratamiento de datos personales en Padel Club OS.",
  alternates: { canonical: "/privacidad" },
}

export default function PrivacidadPage() {
  const provider = getLegalProvider()

  return (
    <LegalPage
      title="Política de privacidad"
      version={LEGAL_VERSIONS.privacidad}
      updatedAt={LEGAL_LAST_UPDATED}
      description="Esta política explica cuándo Padel Club OS decide sobre un tratamiento y cuándo trata datos únicamente por cuenta de un club."
    >
      <LegalIdentityWarning provider={provider} />

      <section>
        <h2>1. Responsable de los tratamientos propios</h2>
        <LegalIdentityDetails provider={provider} />
        <p className="mt-3">
          El contacto de privacidad es <a href={`mailto:${provider.email}`}>{provider.email}</a>. No se ha designado
          delegado de protección de datos al no haberse determinado que resulte obligatorio; si esta situación cambia,
          sus datos se publicarán aquí.
        </p>
      </section>

      <section>
        <h2>2. Dos roles distintos</h2>
        <h3 className="mt-4">Padel Club OS como responsable</h3>
        <p className="mt-2">
          Decidimos cómo tratar los datos de visitantes, contactos comerciales, administradores de clientes,
          facturación, seguridad y cumplimiento de nuestras propias obligaciones.
        </p>
        <h3 className="mt-4">Padel Club OS como encargado</h3>
        <p className="mt-2">
          Cada club decide para qué gestiona los datos de sus jugadores, socios, personal, reservas, competiciones y
          comunicaciones. En esos tratamientos el club es responsable y Padel Club OS actúa siguiendo sus instrucciones,
          conforme al <a href="/acuerdo-tratamiento-datos">Acuerdo de tratamiento de datos</a>. Los jugadores deben
          dirigirse primero a su club para ejercer derechos relacionados con esa actividad.
        </p>
      </section>

      <section>
        <h2>3. Tratamientos propios</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead><tr className="border-b"><th className="p-3">Finalidad</th><th className="p-3">Datos</th><th className="p-3">Base jurídica</th><th className="p-3">Conservación</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="p-3">Crear y administrar la cuenta del club</td><td className="p-3">Identidad, contacto, credenciales, rol y actividad</td><td className="p-3">Contrato y medidas precontractuales</td><td className="p-3">Durante la relación y los plazos de responsabilidades</td></tr>
              <tr className="border-b"><td className="p-3">Suscripción, cobro y facturación</td><td className="p-3">Razón social, NIF, dirección, plan e identificadores Stripe</td><td className="p-3">Contrato y obligaciones fiscales/contables</td><td className="p-3">Durante los plazos legales aplicables</td></tr>
              <tr className="border-b"><td className="p-3">Atender consultas y demos</td><td className="p-3">Nombre, email, teléfono y contenido del mensaje</td><td className="p-3">Medidas precontractuales o interés legítimo en responder</td><td className="p-3">Hasta cerrar la consulta y, como máximo, 24 meses salvo relación posterior</td></tr>
              <tr className="border-b"><td className="p-3">Mensajes comerciales</td><td className="p-3">Contacto y preferencias</td><td className="p-3">Consentimiento o relación previa en los casos permitidos</td><td className="p-3">Hasta retirar el consentimiento u oponerse</td></tr>
              <tr><td className="p-3">Seguridad, prevención de abuso y defensa de reclamaciones</td><td className="p-3">IP, registros técnicos, dispositivo, eventos de auditoría</td><td className="p-3">Interés legítimo y obligaciones legales</td><td className="p-3">El tiempo proporcionado al riesgo y a posibles responsabilidades</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>4. Datos tratados por cuenta de los clubes</h2>
        <p className="mt-3">
          Según las funciones utilizadas, la plataforma puede alojar datos identificativos y de contacto, credenciales
          protegidas mediante hash, reservas, asistencia, pagos y reembolsos, nivel y estadísticas deportivas,
          equipos, resultados, valoraciones, chats, notificaciones y registros de actividad. No almacenamos los datos
          completos de tarjetas. La plataforma no está diseñada para historias clínicas ni otras categorías especiales.
        </p>
      </section>

      <section>
        <h2>5. Procedencia y obligación de facilitar datos</h2>
        <p className="mt-3">
          Los datos proceden de la persona interesada, del administrador del club, de otros usuarios cuando organizan
          una actividad y de proveedores de pago o autenticación. Los campos marcados como obligatorios son necesarios
          para crear una cuenta o ejecutar la función solicitada; sin ellos no podremos prestarla.
        </p>
      </section>

      <section>
        <h2>6. Destinatarios y proveedores</h2>
        <p className="mt-3">
          Acceden a datos, en la medida necesaria, proveedores de alojamiento y base de datos, correo transaccional,
          monitorización, control de abuso y pagos. La lista funcional de subencargados figura en el DPA. También pueden
          comunicarse datos a administraciones, juzgados o fuerzas de seguridad cuando exista obligación legal.
          No vendemos datos personales.
        </p>
      </section>

      <section>
        <h2>7. Transferencias internacionales</h2>
        <p className="mt-3">
          Algunos proveedores pueden tratar datos fuera del Espacio Económico Europeo. En esos casos se emplearán los
          mecanismos previstos por el RGPD, como decisiones de adecuación, el Marco de Privacidad de Datos UE-EE. UU.
          cuando sea aplicable o cláusulas contractuales tipo, junto con medidas complementarias cuando proceda.
          Puede solicitar información sobre las garantías aplicables mediante el correo de privacidad.
        </p>
      </section>

      <section>
        <h2>8. Derechos</h2>
        <p className="mt-3">
          Puedes solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad, así como retirar un
          consentimiento sin afectar al tratamiento anterior. Escribe a <a href={`mailto:${provider.email}`}>{provider.email}</a>
          indicando el derecho que deseas ejercer. Podremos pedir información proporcionada para verificar tu identidad.
          Responderemos, con carácter general, en un mes, ampliable en los supuestos previstos por el RGPD.
        </p>
        <p className="mt-3">
          Si eres jugador, también puedes exportar o solicitar la supresión desde tu perfil y contactar con tu club.
          Puedes reclamar ante la <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos</a>.
        </p>
      </section>

      <section>
        <h2>9. Decisiones automatizadas y menores</h2>
        <p className="mt-3">
          No adoptamos decisiones exclusivamente automatizadas con efectos jurídicos o similares sobre las personas.
          Las cuentas de administración son para mayores de 18 años con capacidad para representar al club. Las cuentas
          de jugador requieren al menos 16 años; el club debe gestionar los requisitos adicionales que correspondan a menores.
        </p>
      </section>

      <section>
        <h2>10. Seguridad y cambios</h2>
        <p className="mt-3">
          Aplicamos controles de acceso por roles, aislamiento lógico entre clubes, comunicaciones cifradas, contraseñas
          con hash, registros de auditoría y medidas de prevención y recuperación acordes con el riesgo. Ningún sistema es
          infalible; gestionaremos las incidencias conforme a la normativa y al DPA.
        </p>
        <p className="mt-3">
          Publicaremos aquí las actualizaciones. Los cambios materiales se comunicarán por un canal adecuado antes de
          que surtan efecto cuando afecten de forma relevante a las personas o a los clientes.
        </p>
      </section>
    </LegalPage>
  )
}
