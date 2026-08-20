import { UserRole } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockHash = vi.fn().mockResolvedValue("hash-seguro")

vi.mock("bcrypt", () => ({
  hash: (...args: unknown[]) => mockHash(...args),
}))

import { asegurarSuperadminInicial } from "./bootstrap-superadmin"

function crearPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn().mockResolvedValue({}),
    },
  }
}

describe("asegurarSuperadminInicial", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("crea el primer superadministrador verificado", async () => {
    const prisma = crearPrismaMock()
    prisma.user.findUnique.mockResolvedValue(null)

    const resultado = await asegurarSuperadminInicial(prisma as never, {
      email: " PROPIETARIO@PADELCLUBOS.COM ",
      password: "una-password-segura",
    })

    expect(resultado).toEqual({
      email: "propietario@padelclubos.com",
      creado: true,
    })
    expect(mockHash).toHaveBeenCalledWith("una-password-segura", 12)
    expect(prisma.user.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: "propietario@padelclubos.com" },
      create: expect.objectContaining({
        role: UserRole.SUPER_ADMIN,
        emailVerified: expect.any(Date),
        password: "hash-seguro",
      }),
    }))
  })

  it("rota contraseña y sesiones al repetir el bootstrap", async () => {
    const prisma = crearPrismaMock()
    const fechaVerificada = new Date("2026-08-20T10:00:00.000Z")
    prisma.user.findUnique.mockResolvedValue({
      role: UserRole.SUPER_ADMIN,
      emailVerified: fechaVerificada,
    })

    const resultado = await asegurarSuperadminInicial(prisma as never, {
      email: "propietario@padelclubos.com",
      password: "otra-password-segura",
    })

    expect(resultado.creado).toBe(false)
    expect(prisma.user.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({
        emailVerified: fechaVerificada,
        sessionVersion: { increment: 1 },
      }),
    }))
  })

  it("no eleva una cuenta normal que ya utiliza el email", async () => {
    const prisma = crearPrismaMock()
    prisma.user.findUnique.mockResolvedValue({
      role: UserRole.CLUB_ADMIN,
      emailVerified: new Date(),
    })

    await expect(asegurarSuperadminInicial(prisma as never, {
      email: "admin@club.demo",
      password: "una-password-segura",
    })).rejects.toThrow("BOOTSTRAP_EMAIL_EN_USO")
    expect(prisma.user.upsert).not.toHaveBeenCalled()
  })

  it("rechaza credenciales débiles antes de consultar la base", async () => {
    const prisma = crearPrismaMock()

    await expect(asegurarSuperadminInicial(prisma as never, {
      email: "correo-invalido",
      password: "corta",
    })).rejects.toThrow("BOOTSTRAP_SUPERADMIN_EMAIL_INVALIDO")
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })
})
