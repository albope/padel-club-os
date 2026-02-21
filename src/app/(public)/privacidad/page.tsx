import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Politica de Privacidad | Padel Club OS",
  description: "Politica de privacidad de Padel Club OS. Informacion sobre el tratamiento de datos personales.",
}

export default function PrivacidadPage() {
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
        Politica de Privacidad
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ultima actualizacion: 21 de febrero de 2026
      </p>

      <div className="mt-10 space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Responsable del tratamiento</h2>
          <p className="mt-3">
            El responsable del tratamiento de los datos personales recogidos a traves de la plataforma
            Padel Club OS (en adelante, &quot;la Plataforma&quot;) es Padel Club OS, con domicilio
            en Espana. Puedes contactarnos en{" "}
            <a href="mailto:contacto@padelclubos.com" className="text-primary hover:underline">
              contacto@padelclubos.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Datos que recopilamos</h2>
          <p className="mt-3">Recopilamos los siguientes tipos de datos personales:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">Datos de registro:</strong> nombre, apellidos,
              correo electronico, telefono y contrasena (almacenada de forma cifrada).
            </li>
            <li>
              <strong className="text-foreground">Datos del club:</strong> nombre del club, direccion,
              informacion de contacto y configuracion de la plataforma.
            </li>
            <li>
              <strong className="text-foreground">Datos de uso:</strong> reservas realizadas,
              participacion en partidas y competiciones, historial de actividad.
            </li>
            <li>
              <strong className="text-foreground">Datos tecnicos:</strong> direccion IP, tipo de
              navegador, dispositivo, sistema operativo y datos de navegacion.
            </li>
            <li>
              <strong className="text-foreground">Datos de pago:</strong> la informacion de pago es
              procesada directamente por Stripe. No almacenamos datos completos de tarjetas de credito.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Finalidad del tratamiento</h2>
          <p className="mt-3">Tratamos tus datos personales para las siguientes finalidades:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Gestionar tu cuenta de usuario y proporcionar acceso a la Plataforma.</li>
            <li>Facilitar la gestion de reservas, partidas abiertas y competiciones.</li>
            <li>Procesar pagos y emitir facturas a traves de nuestro proveedor de pagos (Stripe).</li>
            <li>Enviar comunicaciones relacionadas con el servicio (confirmaciones, recordatorios).</li>
            <li>Mejorar la Plataforma mediante el analisis de datos de uso anonimizados.</li>
            <li>Cumplir con obligaciones legales y fiscales.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Base legal</h2>
          <p className="mt-3">El tratamiento de datos se fundamenta en:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">Ejecucion del contrato:</strong> necesario para
              prestarte el servicio contratado.
            </li>
            <li>
              <strong className="text-foreground">Consentimiento:</strong> para el envio de
              comunicaciones comerciales y el uso de cookies no esenciales.
            </li>
            <li>
              <strong className="text-foreground">Interes legitimo:</strong> para la mejora de la
              Plataforma y la prevencion del fraude.
            </li>
            <li>
              <strong className="text-foreground">Obligacion legal:</strong> para el cumplimiento
              de normativa fiscal y contable.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Comparticion de datos</h2>
          <p className="mt-3">Tus datos pueden ser compartidos con:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">Tu club:</strong> los administradores del club al
              que perteneces pueden ver tus datos de perfil, reservas y participacion en actividades.
            </li>
            <li>
              <strong className="text-foreground">Proveedores de servicios:</strong> Stripe (pagos),
              Vercel (alojamiento), proveedores de correo electronico (notificaciones).
            </li>
            <li>
              <strong className="text-foreground">Autoridades:</strong> cuando sea requerido por ley
              o resolucion judicial.
            </li>
          </ul>
          <p className="mt-3">
            No vendemos tus datos personales a terceros bajo ninguna circunstancia.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Conservacion de datos</h2>
          <p className="mt-3">
            Conservamos tus datos mientras mantengas una cuenta activa en la Plataforma. Si solicitas
            la eliminacion de tu cuenta, procederemos a eliminar tus datos personales en un plazo
            maximo de 30 dias, salvo aquellos que debamos conservar por obligacion legal (datos
            fiscales: 5 anos).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Tus derechos</h2>
          <p className="mt-3">
            De acuerdo con el Reglamento General de Proteccion de Datos (RGPD), tienes derecho a:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong className="text-foreground">Acceso:</strong> solicitar una copia de tus datos personales.</li>
            <li><strong className="text-foreground">Rectificacion:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong className="text-foreground">Supresion:</strong> solicitar la eliminacion de tus datos.</li>
            <li><strong className="text-foreground">Limitacion:</strong> restringir el tratamiento en determinados supuestos.</li>
            <li><strong className="text-foreground">Portabilidad:</strong> recibir tus datos en un formato estructurado.</li>
            <li><strong className="text-foreground">Oposicion:</strong> oponerte al tratamiento basado en interes legitimo.</li>
          </ul>
          <p className="mt-3">
            Para ejercer estos derechos, contactanos en{" "}
            <a href="mailto:contacto@padelclubos.com" className="text-primary hover:underline">
              contacto@padelclubos.com
            </a>. Responderemos en un plazo maximo de 30 dias.
          </p>
          <p className="mt-3">
            Tambien tienes derecho a presentar una reclamacion ante la Agencia Espanola de Proteccion
            de Datos (AEPD) en{" "}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              www.aepd.es
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Seguridad</h2>
          <p className="mt-3">
            Implementamos medidas tecnicas y organizativas para proteger tus datos, incluyendo
            cifrado de contrasenas (bcrypt), conexiones HTTPS, tokens JWT con expiracion, y acceso
            restringido basado en roles (RBAC).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Cambios en esta politica</h2>
          <p className="mt-3">
            Podemos actualizar esta politica periodicamente. Te notificaremos de cambios significativos
            a traves de la Plataforma o por correo electronico. Te recomendamos revisar esta pagina
            regularmente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. Contacto</h2>
          <p className="mt-3">
            Si tienes preguntas sobre esta politica de privacidad o sobre el tratamiento de tus datos,
            puedes contactarnos en{" "}
            <a href="mailto:contacto@padelclubos.com" className="text-primary hover:underline">
              contacto@padelclubos.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
