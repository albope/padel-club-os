import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Terminos de Uso | Padel Club OS",
  description: "Terminos y condiciones de uso de Padel Club OS.",
}

export default function TerminosPage() {
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
        Terminos de Uso
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ultima actualizacion: 21 de febrero de 2026
      </p>

      <div className="mt-10 space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Aceptacion de los terminos</h2>
          <p className="mt-3">
            Al acceder y utilizar la plataforma Padel Club OS (en adelante, &quot;la Plataforma&quot;),
            aceptas quedar vinculado por estos Terminos de Uso. Si no estas de acuerdo con alguno de
            estos terminos, no debes utilizar la Plataforma.
          </p>
          <p className="mt-3">
            Nos reservamos el derecho de modificar estos terminos en cualquier momento. Las
            modificaciones entraran en vigor desde su publicacion en esta pagina. El uso continuado
            de la Plataforma tras la publicacion de cambios implica la aceptacion de los mismos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Descripcion del servicio</h2>
          <p className="mt-3">
            Padel Club OS es una plataforma de gestion integral para clubes de padel que ofrece:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Gestion de reservas de pistas.</li>
            <li>Organizacion de competiciones (ligas y torneos).</li>
            <li>Creacion y gestion de partidas abiertas entre jugadores.</li>
            <li>Portal de acceso para jugadores del club.</li>
            <li>Herramientas de administracion para propietarios y staff del club.</li>
            <li>Procesamiento de pagos online.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Registro y cuentas</h2>
          <h3 className="mt-4 text-lg font-medium text-foreground">3.1 Cuentas de club (administradores)</h3>
          <p className="mt-2">
            Para utilizar la Plataforma como administrador, debes registrar un club proporcionando
            informacion veraz y completa. Eres responsable de mantener la confidencialidad de tus
            credenciales de acceso y de todas las actividades realizadas bajo tu cuenta.
          </p>
          <h3 className="mt-4 text-lg font-medium text-foreground">3.2 Cuentas de jugador</h3>
          <p className="mt-2">
            Los jugadores pueden registrarse a traves del portal de su club. Al registrarte como
            jugador, aceptas que el administrador del club tendra acceso a tus datos de perfil y
            actividad dentro de la Plataforma.
          </p>
          <h3 className="mt-4 text-lg font-medium text-foreground">3.3 Requisitos</h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Debes ser mayor de 16 anos para crear una cuenta.</li>
            <li>Solo puedes tener una cuenta por direccion de correo electronico.</li>
            <li>Debes proporcionar informacion veraz y mantenerla actualizada.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Planes y facturacion</h2>
          <p className="mt-3">
            La Plataforma ofrece diferentes planes de suscripcion para clubes. Los detalles de cada
            plan, incluyendo precio, funcionalidades y limites, estan disponibles en la pagina de
            precios.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Las suscripciones se facturan mensualmente de forma anticipada.</li>
            <li>
              Los pagos se procesan a traves de Stripe. Al suscribirte, aceptas los{" "}
              <a href="https://stripe.com/es/legal" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                terminos de servicio de Stripe
              </a>.
            </li>
            <li>Puedes cancelar tu suscripcion en cualquier momento. La cancelacion sera efectiva al final del periodo de facturacion vigente.</li>
            <li>No se realizan reembolsos por periodos parciales de uso.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Uso aceptable</h2>
          <p className="mt-3">Al utilizar la Plataforma, te comprometes a:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Utilizar el servicio unicamente para fines legitimos relacionados con la gestion de actividades de padel.</li>
            <li>No intentar acceder a cuentas, datos o funcionalidades no autorizadas.</li>
            <li>No utilizar la Plataforma para enviar spam, malware o contenido ilicito.</li>
            <li>No realizar ingenieria inversa, descompilar o desensamblar el software.</li>
            <li>No sobrecargar intencionadamente la infraestructura de la Plataforma.</li>
            <li>Respetar los derechos de propiedad intelectual de Padel Club OS y de terceros.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Reservas y cancelaciones</h2>
          <p className="mt-3">
            Las politicas de reserva y cancelacion son configuradas individualmente por cada club.
            Padel Club OS actua como intermediario tecnologico y no es responsable de:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Las politicas de precios establecidas por cada club.</li>
            <li>Las condiciones de cancelacion y reembolso definidas por cada club.</li>
            <li>La disponibilidad real de las instalaciones del club.</li>
            <li>Disputas entre jugadores y clubes relacionadas con reservas.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Propiedad intelectual</h2>
          <p className="mt-3">
            Todos los derechos de propiedad intelectual sobre la Plataforma (codigo, diseno,
            logotipos, textos, graficos) pertenecen a Padel Club OS o a sus licenciantes. No se
            concede ninguna licencia o derecho sobre estos elementos mas alla del uso normal de la
            Plataforma.
          </p>
          <p className="mt-3">
            Los datos introducidos por los clubes y jugadores en la Plataforma son propiedad de sus
            respectivos titulares. Padel Club OS se compromete a facilitar la exportacion de estos
            datos cuando sea solicitado.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Disponibilidad del servicio</h2>
          <p className="mt-3">
            Nos esforzamos por mantener la Plataforma disponible de forma ininterrumpida, pero no
            garantizamos una disponibilidad del 100%. Podemos realizar tareas de mantenimiento que
            requieran interrupciones temporales del servicio, notificandolo con la mayor antelacion
            posible.
          </p>
          <p className="mt-3">
            Padel Club OS no sera responsable de interrupciones causadas por fuerza mayor, fallos
            de terceros proveedores, o circunstancias fuera de nuestro control razonable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Limitacion de responsabilidad</h2>
          <p className="mt-3">
            En la maxima medida permitida por la ley, Padel Club OS no sera responsable de danos
            indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad
            de uso de la Plataforma.
          </p>
          <p className="mt-3">
            Nuestra responsabilidad total acumulada no excedera el importe abonado por el usuario en
            los 12 meses anteriores al evento que genere la reclamacion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. Suspension y cancelacion</h2>
          <p className="mt-3">
            Nos reservamos el derecho de suspender o cancelar cuentas que:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Incumplan estos Terminos de Uso.</li>
            <li>Realicen un uso fraudulento o abusivo de la Plataforma.</li>
            <li>No abonen las cuotas de suscripcion en los plazos establecidos.</li>
          </ul>
          <p className="mt-3">
            En caso de cancelacion, facilitaremos la exportacion de los datos del club durante un
            periodo de 30 dias.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">11. Legislacion aplicable</h2>
          <p className="mt-3">
            Estos terminos se rigen por la legislacion espanola. Para cualquier controversia derivada
            del uso de la Plataforma, las partes se someten a la jurisdiccion de los juzgados y
            tribunales de Espana.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">12. Contacto</h2>
          <p className="mt-3">
            Para cualquier consulta relacionada con estos terminos, contactanos en{" "}
            <a href="mailto:contacto@padelclubos.com" className="text-primary hover:underline">
              contacto@padelclubos.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
