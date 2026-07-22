import type { Metadata } from "next"
import { LegalIdentityWarning } from "@/components/legal/LegalIdentity"
import { LegalPage } from "@/components/legal/LegalPage"
import { getLegalProvider } from "@/lib/legal"
import { LEGAL_LAST_UPDATED, LEGAL_VERSIONS } from "@/lib/legal-versions"

export const metadata: Metadata = {
  title: "Acuerdo de tratamiento de datos (DPA)",
  description: "Acuerdo RGPD entre los clubes responsables y Padel Club OS como encargado del tratamiento.",
  alternates: { canonical: "/acuerdo-tratamiento-datos" },
}

export default function DpaPage() {
  const provider = getLegalProvider()
  const processorName = provider.legalName || "el titular identificado en el Aviso legal"

  return (
    <LegalPage
      title="Acuerdo de tratamiento de datos (DPA)"
      version={LEGAL_VERSIONS.dpa}
      updatedAt={LEGAL_LAST_UPDATED}
      description="Cláusulas del artículo 28 RGPD incorporadas al contrato SaaS entre el club y Padel Club OS."
    >
      <LegalIdentityWarning provider={provider} />

      <section>
        <h2>1. Partes y función</h2>
        <p className="mt-3">
          Este acuerdo se celebra entre el club identificado en la cuenta y en los datos de facturación (el
          «Responsable») y <strong>{processorName}</strong> (el «Encargado»). La persona que lo acepta por el club
          declara estar autorizada para vincularlo. El DPA entra en vigor junto con las{" "}
          <a href="/terminos">Condiciones del servicio SaaS</a>.
        </p>
      </section>

      <section>
        <h2>2. Objeto, duración, naturaleza y finalidad</h2>
        <p className="mt-3">
          El Responsable habilita al Encargado para tratar los datos necesarios para alojar, organizar, consultar,
          modificar, transmitir, respaldar, recuperar, exportar y suprimir información mediante Padel Club OS. El
          tratamiento dura mientras se presta el servicio y durante el periodo técnico necesario para devolver,
          suprimir o bloquear la información al finalizar.
        </p>
        <p className="mt-3">
          La finalidad exclusiva es facilitar al Responsable la gestión de usuarios, reservas, pistas, actividades,
          pagos, comunicaciones, competiciones, soporte, seguridad y las demás funciones activadas en su plan.
        </p>
      </section>

      <section>
        <h2>3. Interesados y tipos de datos</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead><tr className="border-b"><th className="p-3">Interesados</th><th className="p-3">Datos</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="p-3">Administradores y personal</td><td className="p-3">Identidad, contacto, rol, credenciales con hash, actividad y auditoría</td></tr>
              <tr className="border-b"><td className="p-3">Socios, jugadores e invitados</td><td className="p-3">Identidad, contacto, fecha de nacimiento opcional, nivel, posición, imagen y notas administrativas</td></tr>
              <tr className="border-b"><td className="p-3">Participantes en actividades</td><td className="p-3">Reservas, asistencia, equipos, resultados, estadísticas, chats, valoraciones y lista de espera</td></tr>
              <tr><td className="p-3">Personas pagadoras</td><td className="p-3">Importes, estado, método y referencias de Stripe; no datos completos de tarjeta</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          No se prevé tratar categorías especiales del artículo 9 RGPD ni datos penales. El Responsable no los
          introducirá en campos libres sin acordar previamente instrucciones y medidas adicionales por escrito.
        </p>
      </section>

      <section>
        <h2>4. Instrucciones documentadas</h2>
        <p className="mt-3">
          El Encargado tratará los datos únicamente conforme a este DPA, la configuración y acciones lícitas de los
          usuarios autorizados, solicitudes de soporte del Responsable y otras instrucciones escritas compatibles con
          el servicio. Si considera que una instrucción infringe la normativa, lo comunicará y podrá suspenderla hasta aclararla.
        </p>
        <p className="mt-3">
          Si una norma de la Unión o de un Estado miembro obliga a otro tratamiento, el Encargado informará antes al
          Responsable, salvo prohibición legal por razones importantes de interés público.
        </p>
      </section>

      <section>
        <h2>5. Confidencialidad y personal autorizado</h2>
        <p className="mt-3">
          El Encargado limitará el acceso a personal que lo necesite para prestar o proteger el servicio, sujeto a
          compromisos de confidencialidad y formación o instrucciones adecuadas. Mantendrá el deber de secreto después de finalizar su intervención.
        </p>
      </section>

      <section>
        <h2>6. Medidas técnicas y organizativas</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>HTTPS para comunicaciones y cifrado gestionado por los proveedores de infraestructura cuando corresponda;</li>
          <li>contraseñas almacenadas mediante funciones de hash y secretos fuera del código fuente;</li>
          <li>autenticación, permisos por rol y aislamiento lógico por club;</li>
          <li>registro de acciones administrativas relevantes y monitorización de errores;</li>
          <li>limitación de solicitudes, validación de entradas y cabeceras de seguridad;</li>
          <li>mecanismos de recuperación y restauración disponibles en la infraestructura contratada;</li>
          <li>gestión de vulnerabilidades, actualizaciones y revisión de accesos conforme al riesgo;</li>
          <li>procedimientos de respuesta ante incidentes y minimización de datos en registros técnicos.</li>
        </ul>
        <p className="mt-3">
          Las medidas podrán evolucionar sin reducir materialmente el nivel global de protección. El Responsable
          configurará correctamente roles, conservará sus credenciales y revisará los accesos de su organización.
        </p>
      </section>

      <section>
        <h2>7. Subencargados autorizados</h2>
        <p className="mt-3">
          El Responsable concede autorización general para utilizar los siguientes proveedores cuando la función
          correspondiente esté activa. El Encargado les impondrá obligaciones de protección equivalentes en lo aplicable.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead><tr className="border-b"><th className="p-3">Proveedor</th><th className="p-3">Servicio</th><th className="p-3">Datos afectados</th><th className="p-3">Información</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="p-3">Vercel Inc.</td><td className="p-3">Alojamiento, ejecución y archivos</td><td className="p-3">Datos y registros procesados por la aplicación</td><td className="p-3"><a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer">DPA</a></td></tr>
              <tr className="border-b"><td className="p-3">Neon, Inc.</td><td className="p-3">Base de datos PostgreSQL</td><td className="p-3">Datos persistentes de la plataforma</td><td className="p-3"><a href="https://neon.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacidad</a></td></tr>
              <tr className="border-b"><td className="p-3">Resend, Inc.</td><td className="p-3">Correo transaccional</td><td className="p-3">Email, nombre y contenido del mensaje</td><td className="p-3"><a href="https://resend.com/legal/dpa" target="_blank" rel="noopener noreferrer">DPA</a></td></tr>
              <tr className="border-b"><td className="p-3">Stripe</td><td className="p-3">Suscripciones y pagos Connect</td><td className="p-3">Identidad, contacto, datos fiscales, importes e identificadores de pago</td><td className="p-3"><a href="https://stripe.com/es/legal/privacy-center" target="_blank" rel="noopener noreferrer">Centro de privacidad</a></td></tr>
              <tr className="border-b"><td className="p-3">Functional Software, Inc. (Sentry)</td><td className="p-3">Diagnóstico de errores</td><td className="p-3">Datos técnicos y contexto minimizado del error</td><td className="p-3"><a href="https://sentry.io/legal/dpa/" target="_blank" rel="noopener noreferrer">DPA</a></td></tr>
              <tr><td className="p-3">Upstash, Inc.</td><td className="p-3">Control distribuido de abuso, si se activa</td><td className="p-3">Identificador técnico o IP usado para limitar solicitudes</td><td className="p-3"><a href="https://upstash.com/trust/dpa.pdf" target="_blank" rel="noopener noreferrer">DPA</a></td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Los cambios en esta lista se comunicarán con antelación razonable. El Responsable podrá oponerse por motivos
          fundados de protección de datos; las partes buscarán una alternativa viable. Si no existe, cualquiera podrá
          terminar la función afectada o el contrato sin penalización adicional.
        </p>
      </section>

      <section>
        <h2>8. Transferencias internacionales</h2>
        <p className="mt-3">
          Cuando un subencargado trate datos fuera del EEE, el Encargado verificará un mecanismo válido conforme al
          capítulo V RGPD, como una decisión de adecuación, el Marco de Privacidad de Datos UE-EE. UU. para entidades
          adheridas o cláusulas contractuales tipo, y evaluará medidas complementarias cuando proceda.
        </p>
      </section>

      <section>
        <h2>9. Derechos de los interesados</h2>
        <p className="mt-3">
          Teniendo en cuenta la naturaleza del tratamiento, el Encargado ayudará al Responsable mediante las funciones
          de consulta, corrección, exportación y supresión disponibles y mediante soporte razonable. Si recibe una
          solicitud relativa a datos del Responsable, la remitirá sin responder por cuenta propia, salvo obligación legal.
        </p>
      </section>

      <section>
        <h2>10. Seguridad y violaciones de datos</h2>
        <p className="mt-3">
          El Encargado notificará al Responsable, sin dilación indebida después de tener constancia, una violación que
          afecte a sus datos. Facilitará progresivamente la naturaleza del incidente, categorías y volumen aproximado,
          posibles consecuencias, medidas adoptadas y contacto disponible, en la medida en que conozca esa información.
          La notificación no supone reconocimiento de culpa.
        </p>
      </section>

      <section>
        <h2>11. Evaluaciones, consultas y cumplimiento</h2>
        <p className="mt-3">
          El Encargado proporcionará información razonablemente necesaria para demostrar el cumplimiento y ayudará,
          atendiendo a la naturaleza del tratamiento y la información disponible, en evaluaciones de impacto y consultas
          previas. Cada parte asumirá sus costes ordinarios; trabajos extraordinarios solicitados por el Responsable podrán presupuestarse.
        </p>
      </section>

      <section>
        <h2>12. Auditorías</h2>
        <p className="mt-3">
          El Responsable podrá solicitar una vez al año, o tras un incidente relevante, documentación de cumplimiento.
          Si no resulta suficiente, podrá realizar una auditoría con preaviso razonable, durante horario laboral, mediante
          un auditor independiente sujeto a confidencialidad y sin comprometer la seguridad ni datos de otros clientes.
        </p>
      </section>

      <section>
        <h2>13. Destino de los datos</h2>
        <p className="mt-3">
          Durante la vigencia, el Responsable utilizará las funciones de exportación disponibles. Al terminar, y a su
          elección comunicada por escrito, el Encargado devolverá una exportación razonablemente disponible o suprimirá
          los datos personales, así como las copias, salvo conservación exigida por ley. Las copias residuales en sistemas
          de recuperación quedarán aisladas del uso ordinario y se eliminarán conforme al ciclo seguro del proveedor.
        </p>
      </section>

      <section>
        <h2>14. Obligaciones del Responsable</h2>
        <p className="mt-3">
          Corresponde al Responsable determinar fines y bases jurídicas, facilitar la información a los interesados,
          garantizar la calidad y minimización de los datos, gestionar sus usuarios, valorar riesgos y evaluaciones de
          impacto, impartir instrucciones lícitas y no ordenar tratamientos incompatibles con este servicio.
        </p>
      </section>

      <section>
        <h2>15. Prevalencia y contacto</h2>
        <p className="mt-3">
          En materia de tratamiento por cuenta del club, este DPA prevalece sobre condiciones contradictorias del contrato
          principal. El resto se rige por las Condiciones del servicio SaaS. Las comunicaciones de protección de datos se
          dirigirán a <a href={`mailto:${provider.email}`}>{provider.email}</a> y al correo del administrador del Responsable.
        </p>
      </section>
    </LegalPage>
  )
}
