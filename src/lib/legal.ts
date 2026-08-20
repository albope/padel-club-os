import "server-only"

export interface LegalProvider {
  entityType: "individual" | "company" | null
  tradeName: string
  legalName: string | null
  taxId: string | null
  address: string | null
  registry: string | null
  email: string
  website: string
  incompleteFields: string[]
}

const DEFAULT_LEGAL_PROVIDER = {
  entityType: "company",
  legalName: "BORT PEREZ MULTI GESTION SOCIEDAD LIMITADA",
  taxId: "B98629470",
  address: "Avenida Carlos Marx, 1, 12 E, 46920 Mislata, Valencia, España",
  registry: "Inscrita en el Registro Mercantil de Valencia, tomo 9786, libro 7068, folio 52, sección 8, hoja V-159244",
  email: "albertobort@gmail.com",
} as const

function optionalEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value || null
}

export function getLegalProvider(): LegalProvider {
  const rawEntityType = optionalEnv("LEGAL_ENTITY_TYPE")
  const entityType = rawEntityType === "individual" || rawEntityType === "company"
    ? rawEntityType
    : DEFAULT_LEGAL_PROVIDER.entityType
  const legalName = optionalEnv("LEGAL_NAME") || DEFAULT_LEGAL_PROVIDER.legalName
  const taxId = optionalEnv("LEGAL_TAX_ID") || DEFAULT_LEGAL_PROVIDER.taxId
  // Esta variable se muestra en el Aviso legal. Debe contener únicamente un
  // domicilio apto para publicación, nunca una dirección privada introducida
  // como dato interno de facturación.
  const address = optionalEnv("LEGAL_PUBLIC_ADDRESS") || DEFAULT_LEGAL_PROVIDER.address
  const registry = optionalEnv("LEGAL_REGISTRY_DETAILS") || DEFAULT_LEGAL_PROVIDER.registry
  const email = optionalEnv("LEGAL_EMAIL") || DEFAULT_LEGAL_PROVIDER.email
  const website = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://padelclubos.com"

  const incompleteFields = [
    entityType !== "company" && "sociedad emisora",
    !legalName && "nombre o razón social",
    !taxId && "NIF",
    !address && "domicilio",
    entityType === "company" && !registry && "datos del Registro Mercantil",
  ].filter((field): field is string => Boolean(field))

  return {
    entityType,
    tradeName: "Padel Club OS",
    legalName,
    taxId,
    address,
    registry,
    email,
    website,
    incompleteFields,
  }
}

export function isStripeTaxEnabled(): boolean {
  return process.env.STRIPE_TAX_ENABLED?.trim().toLowerCase() === "true"
}
