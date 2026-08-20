import { afterEach, describe, expect, it, vi } from "vitest"

import { getLegalProvider } from "./legal"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("getLegalProvider", () => {
  it("publica por defecto la identidad legal completa de la sociedad", () => {
    expect(getLegalProvider()).toMatchObject({
      entityType: "company",
      legalName: "BORT PEREZ MULTI GESTION SOCIEDAD LIMITADA",
      taxId: "B98629470",
      address: "Avenida Carlos Marx, 1, 12 E, 46920 Mislata, Valencia, España",
      registry: "Inscrita en el Registro Mercantil de Valencia, tomo 9786, libro 7068, folio 52, sección 8, hoja V-159244",
      email: "albertobort@gmail.com",
      incompleteFields: [],
    })
  })

  it("permite sobrescribir la identidad mediante variables de entorno", () => {
    vi.stubEnv("LEGAL_ENTITY_TYPE", "company")
    vi.stubEnv("LEGAL_NAME", "Sociedad de prueba SL")
    vi.stubEnv("LEGAL_TAX_ID", "B12345678")
    vi.stubEnv("LEGAL_PUBLIC_ADDRESS", "Calle de prueba 1")
    vi.stubEnv("LEGAL_REGISTRY_DETAILS", "Registro Mercantil de prueba")
    vi.stubEnv("LEGAL_EMAIL", "legal@prueba.test")

    expect(getLegalProvider()).toMatchObject({
      legalName: "Sociedad de prueba SL",
      taxId: "B12345678",
      address: "Calle de prueba 1",
      registry: "Registro Mercantil de prueba",
      email: "legal@prueba.test",
      incompleteFields: [],
    })
  })

  it("avisa si producción conserva una identidad individual anterior", () => {
    vi.stubEnv("LEGAL_ENTITY_TYPE", "individual")
    vi.stubEnv("LEGAL_NAME", "Titular anterior")
    vi.stubEnv("LEGAL_TAX_ID", "12345678Z")
    vi.stubEnv("LEGAL_PUBLIC_ADDRESS", "Calle de prueba 1")

    expect(getLegalProvider().incompleteFields).toContain("sociedad emisora")
  })
})
