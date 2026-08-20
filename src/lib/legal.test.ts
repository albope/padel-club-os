import { afterEach, describe, expect, it, vi } from "vitest"

import { getLegalProvider } from "./legal"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("getLegalProvider", () => {
  it("exige datos registrales cuando el prestador es una sociedad", () => {
    vi.stubEnv("LEGAL_ENTITY_TYPE", "company")
    vi.stubEnv("LEGAL_NAME", "Sociedad de prueba SL")
    vi.stubEnv("LEGAL_TAX_ID", "B12345678")
    vi.stubEnv("LEGAL_PUBLIC_ADDRESS", "Calle de prueba 1")
    vi.stubEnv("LEGAL_REGISTRY_DETAILS", "")

    expect(getLegalProvider().incompleteFields).toContain("datos del Registro Mercantil")
  })

  it("considera completa una sociedad con identidad y registro", () => {
    vi.stubEnv("LEGAL_ENTITY_TYPE", "company")
    vi.stubEnv("LEGAL_NAME", "Sociedad de prueba SL")
    vi.stubEnv("LEGAL_TAX_ID", "B12345678")
    vi.stubEnv("LEGAL_PUBLIC_ADDRESS", "Calle de prueba 1")
    vi.stubEnv("LEGAL_REGISTRY_DETAILS", "Registro Mercantil de prueba")

    expect(getLegalProvider().incompleteFields).toEqual([])
  })

  it("avisa si producción conserva una identidad individual anterior", () => {
    vi.stubEnv("LEGAL_ENTITY_TYPE", "individual")
    vi.stubEnv("LEGAL_NAME", "Titular anterior")
    vi.stubEnv("LEGAL_TAX_ID", "12345678Z")
    vi.stubEnv("LEGAL_PUBLIC_ADDRESS", "Calle de prueba 1")

    expect(getLegalProvider().incompleteFields).toContain("sociedad emisora")
  })
})
