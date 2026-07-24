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

function optionalEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value || null
}

export function getLegalProvider(): LegalProvider {
  const rawEntityType = optionalEnv("LEGAL_ENTITY_TYPE")
  const entityType = rawEntityType === "individual" || rawEntityType === "company"
    ? rawEntityType
    : null
  const legalName = optionalEnv("LEGAL_NAME")
  const taxId = optionalEnv("LEGAL_TAX_ID")
  const address = optionalEnv("LEGAL_ADDRESS")
  const registry = optionalEnv("LEGAL_REGISTRY_DETAILS")
  const email = optionalEnv("LEGAL_EMAIL") || process.env.CONTACT_EMAIL?.trim() || "contacto@padelclubos.com"
  const website = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://padelclubos.com"

  const incompleteFields = [
    !entityType && "tipo de titular",
    !legalName && "nombre o razón social",
    !taxId && "NIF/CIF",
    !address && "domicilio",
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
