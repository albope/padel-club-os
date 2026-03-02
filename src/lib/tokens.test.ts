import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb } from "@/test/mocks/db"

vi.mock("@/lib/db", () => ({ db: mockDb }))

import {
  hashToken,
  generarTokenAleatorio,
  crearTokenRecuperacion,
  verificarTokenRecuperacion,
  eliminarTokenRecuperacion,
} from "./tokens"

describe("hashToken", () => {
  it("genera hash SHA-256 determinista", () => {
    const hash = hashToken("mi-token-secreto")
    // Mismo input siempre produce mismo output
    expect(hashToken("mi-token-secreto")).toBe(hash)
  })

  it("produce un hash de 64 caracteres hexadecimales", () => {
    const hash = hashToken("test")
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("produce hashes diferentes para inputs diferentes", () => {
    const hash1 = hashToken("token1")
    const hash2 = hashToken("token2")
    expect(hash1).not.toBe(hash2)
  })
})

describe("generarTokenAleatorio", () => {
  it("retorna string de 64 caracteres hexadecimales", () => {
    const token = generarTokenAleatorio()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it("genera tokens unicos en llamadas consecutivas", () => {
    const token1 = generarTokenAleatorio()
    const token2 = generarTokenAleatorio()
    expect(token1).not.toBe(token2)
  })
})

describe("crearTokenRecuperacion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
  })

  it("elimina tokens previos del email", async () => {
    mockDb.passwordResetToken.create.mockResolvedValue({})
    await crearTokenRecuperacion("test@test.com")

    expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { email: "test@test.com" },
    })
  })

  it("crea token con hash (no texto plano) y expiracion 1h", async () => {
    mockDb.passwordResetToken.create.mockResolvedValue({})
    const tokenPlano = await crearTokenRecuperacion("test@test.com")

    const createCall = mockDb.passwordResetToken.create.mock.calls[0][0]
    // El token almacenado es un hash, no el token en texto plano
    expect(createCall.data.token).not.toBe(tokenPlano)
    expect(createCall.data.token).toBe(hashToken(tokenPlano))
    expect(createCall.data.email).toBe("test@test.com")
    // Expiracion = ahora + 1 hora
    expect(createCall.data.expires).toEqual(new Date("2024-06-15T13:00:00Z"))
  })

  it("retorna un token en texto plano de 64 caracteres hex", async () => {
    mockDb.passwordResetToken.create.mockResolvedValue({})
    const token = await crearTokenRecuperacion("test@test.com")
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})

describe("verificarTokenRecuperacion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna email si el token es valido y no ha expirado", async () => {
    const tokenPlano = "a".repeat(64)
    const tokenHash = hashToken(tokenPlano)

    mockDb.passwordResetToken.findUnique.mockResolvedValue({
      id: "1",
      email: "test@test.com",
      token: tokenHash,
      expires: new Date(Date.now() + 3600000), // 1h en el futuro
    })

    const email = await verificarTokenRecuperacion(tokenPlano)
    expect(email).toBe("test@test.com")
  })

  it("retorna null si el token no existe", async () => {
    mockDb.passwordResetToken.findUnique.mockResolvedValue(null)

    const email = await verificarTokenRecuperacion("token-inexistente")
    expect(email).toBeNull()
  })

  it("retorna null y elimina si el token ha expirado", async () => {
    const tokenPlano = "b".repeat(64)

    mockDb.passwordResetToken.findUnique.mockResolvedValue({
      id: "2",
      email: "expirado@test.com",
      token: hashToken(tokenPlano),
      expires: new Date(Date.now() - 1000), // ya expiro
    })
    mockDb.passwordResetToken.delete.mockResolvedValue({})

    const email = await verificarTokenRecuperacion(tokenPlano)
    expect(email).toBeNull()
    expect(mockDb.passwordResetToken.delete).toHaveBeenCalledWith({
      where: { id: "2" },
    })
  })
})

describe("eliminarTokenRecuperacion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("elimina usando el hash del token", async () => {
    const tokenPlano = "c".repeat(64)
    mockDb.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 })

    await eliminarTokenRecuperacion(tokenPlano)

    expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { token: hashToken(tokenPlano) },
    })
  })
})
