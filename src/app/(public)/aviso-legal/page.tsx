import type { Metadata } from "next"
import { LegalIdentityDetails, LegalIdentityWarning } from "@/components/legal/LegalIdentity"
import { LegalPage } from "@/components/legal/LegalPage"
import { getLegalProvider } from "@/lib/legal"
import { LEGAL_LAST_UPDATED, LEGAL_VERSIONS } from "@/lib/legal-versions"

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Identificación del titular y condiciones de acceso al sitio web de Padel Club OS.",
  alternates: { canonical: "/aviso-legal" },
}

export default function AvisoLegalPage() {
  const provider = getLegalProvider()

  return (
    <LegalPage
      title="Aviso legal"
      version={LEGAL_VERSIONS.avisoLegal}
      updatedAt={LEGAL_LAST_UPDATED}
      description="Información general del prestador del servicio y reglas de acceso a este sitio web."
    >
      <LegalIdentityWarning provider={provider} />

      <section>
        <h2>1. Identificación del titular</h2>
        <p className="mt-3">
          En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información
          y de comercio electrónico, se facilitan los datos del titular de este sitio y de la plataforma.
        </p>
        <LegalIdentityDetails provider={provider} />
        {!provider.registry && (
          <p className="mt-3 text-sm">
            Si el titular está inscrito en un registro público, sus datos registrales deberán incorporarse aquí antes del lanzamiento comercial.
          </p>
        )}
      </section>

      <section>
        <h2>2. Objeto</h2>
        <p className="mt-3">
          Este sitio informa y permite contratar Padel Club OS, una plataforma de software como servicio
          para la gestión de clubes de pádel. Las condiciones aplicables a la suscripción se recogen en las{" "}
          <a href="/terminos">Condiciones del servicio SaaS</a> y el tratamiento de datos por cuenta del club
          se regula en el <a href="/acuerdo-tratamiento-datos">Acuerdo de tratamiento de datos</a>.
        </p>
      </section>

      <section>
        <h2>3. Acceso y uso del sitio</h2>
        <p className="mt-3">
          La persona usuaria se compromete a utilizar el sitio de forma lícita, a no interferir en su seguridad
          o disponibilidad y a no intentar acceder a sistemas o datos para los que no esté autorizada. El acceso
          informativo al sitio es gratuito, sin perjuicio del precio de los planes contratados.
        </p>
      </section>

      <section>
        <h2>4. Propiedad intelectual e industrial</h2>
        <p className="mt-3">
          Salvo indicación distinta, el software, diseño, marca, textos y demás contenidos del sitio pertenecen
          al titular o se utilizan con licencia. No se autoriza su explotación, reproducción o transformación
          fuera de los límites legales o de una autorización escrita.
        </p>
      </section>

      <section>
        <h2>5. Enlaces y disponibilidad</h2>
        <p className="mt-3">
          Los enlaces externos se ofrecen como referencia. El titular no controla su contenido ni garantiza su
          disponibilidad. Se aplican medidas razonables para mantener el sitio operativo y seguro, aunque pueden
          producirse interrupciones por mantenimiento, incidencias de terceros o causas de fuerza mayor.
        </p>
      </section>

      <section>
        <h2>6. Responsabilidad</h2>
        <p className="mt-3">
          El titular responderá en los términos exigidos por la normativa aplicable. Nada en este aviso excluye
          responsabilidades que no puedan limitarse legalmente. Las condiciones de responsabilidad relativas al
          servicio contratado se detallan en las Condiciones del servicio SaaS.
        </p>
      </section>

      <section>
        <h2>7. Legislación y contacto</h2>
        <p className="mt-3">
          Este aviso se rige por la legislación española. Para comunicar una incidencia relacionada con el sitio,
          escribe a <a href={`mailto:${provider.email}`}>{provider.email}</a>.
        </p>
      </section>
    </LegalPage>
  )
}
