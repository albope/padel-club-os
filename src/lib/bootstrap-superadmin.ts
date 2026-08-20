import { UserRole, type PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"

export interface ConfiguracionSuperadminInicial {
  email: string
  password: string
  nombre?: string
}

export interface ResultadoSuperadminInicial {
  email: string
  creado: boolean
}

/**
 * Crea o recupera el acceso propietario de una instalación vacía.
 *
 * Una segunda ejecución rota la contraseña y las sesiones anteriores. Nunca
 * convierte una cuenta normal existente en superadministrador.
 */
export async function asegurarSuperadminInicial(
  prisma: PrismaClient,
  config: ConfiguracionSuperadminInicial,
): Promise<ResultadoSuperadminInicial> {
  const email = config.email.trim().toLowerCase()
  const password = config.password.trim()
  const nombre = config.nombre?.trim() || "Administración de Padel Club OS"

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("BOOTSTRAP_SUPERADMIN_EMAIL_INVALIDO")
  }
  if (password.length < 12 || password.length > 128) {
    throw new Error("BOOTSTRAP_SUPERADMIN_PASSWORD_INVALIDA")
  }

  const existente = await prisma.user.findUnique({
    where: { email },
    select: { role: true, emailVerified: true },
  })
  if (existente && existente.role !== UserRole.SUPER_ADMIN) {
    throw new Error("BOOTSTRAP_EMAIL_EN_USO")
  }

  const ahora = new Date()
  const passwordHash = await hash(password, 12)
  await prisma.user.upsert({
    where: { email },
    create: {
      name: nombre,
      email,
      password: passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: ahora,
      isActive: true,
      mustResetPassword: false,
    },
    update: {
      name: nombre,
      password: passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: existente?.emailVerified || ahora,
      isActive: true,
      mustResetPassword: false,
      clubId: null,
      sessionVersion: { increment: 1 },
    },
  })

  return { email, creado: !existente }
}
