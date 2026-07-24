import { MembershipStatus, UserRole } from "@prisma/client"
import { db } from "./db"

export function normalizarEmail(email: string): string {
  return email.trim().toLocaleLowerCase("en-US").normalize("NFKC")
}

export async function obtenerMembresiaActiva(
  userId: string,
  options: { clubId?: string; clubSlug?: string } = {},
) {
  return db.clubMembership.findFirst({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
      ...(options.clubId ? { clubId: options.clubId } : {}),
      ...(options.clubSlug ? { club: { slug: options.clubSlug } } : {}),
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionStatus: true,
          trialEndsAt: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })
}

export async function perteneceAlClub(
  userId: string,
  clubId: string,
  roles?: UserRole[],
): Promise<boolean> {
  const membership = await db.clubMembership.findFirst({
    where: {
      userId,
      clubId,
      status: MembershipStatus.ACTIVE,
      ...(roles?.length ? { role: { in: roles } } : {}),
    },
    select: { id: true },
  })

  if (membership) return true

  // Compatibilidad durante el despliegue escalonado del modelo Membership.
  const legacy = await db.user.findFirst({
    where: {
      id: userId,
      clubId,
      isActive: true,
      ...(roles?.length ? { role: { in: roles } } : {}),
    },
    select: { id: true },
  })
  return Boolean(legacy)
}

export async function asegurarMembresiaPrincipal(params: {
  userId: string
  clubId: string
  role: UserRole
  active?: boolean
}) {
  const active = params.active ?? true
  return db.clubMembership.upsert({
    where: {
      userId_clubId: {
        userId: params.userId,
        clubId: params.clubId,
      },
    },
    create: {
      userId: params.userId,
      clubId: params.clubId,
      role: params.role,
      status: active ? MembershipStatus.ACTIVE : MembershipStatus.SUSPENDED,
      approvedAt: active ? new Date() : null,
    },
    update: {
      role: params.role,
      status: active ? MembershipStatus.ACTIVE : MembershipStatus.SUSPENDED,
      approvedAt: active ? new Date() : null,
    },
  })
}
