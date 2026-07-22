import type { LegalProvider } from "@/lib/legal"

export function LegalIdentityWarning({ provider }: { provider: LegalProvider }) {
  if (provider.incompleteFields.length === 0) return null

  return (
    <aside className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground" role="status">
      <strong>Documento pendiente de completar antes de aceptar pagos reales.</strong>{" "}
      Faltan: {provider.incompleteFields.join(", ")}. Estos datos no se pueden sustituir por la marca comercial.
    </aside>
  )
}

export function LegalIdentityDetails({ provider }: { provider: LegalProvider }) {
  return (
    <dl className="mt-4 grid gap-3 rounded-lg border bg-muted/30 p-5 sm:grid-cols-[12rem_1fr]">
      <dt className="font-medium text-foreground">Titular</dt>
      <dd>{provider.legalName || "Pendiente de configurar"}</dd>
      <dt className="font-medium text-foreground">NIF/CIF</dt>
      <dd>{provider.taxId || "Pendiente de configurar"}</dd>
      <dt className="font-medium text-foreground">Domicilio</dt>
      <dd>{provider.address || "Pendiente de configurar"}</dd>
      <dt className="font-medium text-foreground">Marca comercial</dt>
      <dd>{provider.tradeName}</dd>
      <dt className="font-medium text-foreground">Correo</dt>
      <dd><a href={`mailto:${provider.email}`}>{provider.email}</a></dd>
      <dt className="font-medium text-foreground">Sitio web</dt>
      <dd><a href={provider.website}>{provider.website}</a></dd>
      {provider.registry && (
        <>
          <dt className="font-medium text-foreground">Datos registrales</dt>
          <dd>{provider.registry}</dd>
        </>
      )}
    </dl>
  )
}
