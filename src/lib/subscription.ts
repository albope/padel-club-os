import { db } from "./db"
import { PLAN_PRICES, PlanKey } from "./stripe"

// Estados de suscripcion que permiten uso completo
const ACTIVE_STATUSES = ["active", "trialing"]

// Estados que permiten acceso limitado (solo lectura + facturacion)
const GRACE_STATUSES = ["past_due"]

export type SubscriptionState = "active" | "trialing" | "past_due" | "canceled" | "expired" | "unpaid"

interface SubscriptionInfo {
  status: SubscriptionState
  tier: PlanKey
  trialEndsAt: Date | null
  isActive: boolean       // puede operar normalmente
  isGracePeriod: boolean  // pago fallido, acceso limitado
  isBlocked: boolean      // no puede operar (expirado/cancelado)
}

/**
 * Determina si una suscripcion esta activa basandose en status y trial.
 * Un trial se considera activo si no ha expirado.
 */
export function isSubscriptionActive(
  status: string | null,
  trialEndsAt: Date | null
): boolean {
  const estado = status ?? "trialing"

  if (estado === "active") return true

  if (estado === "trialing") {
    if (!trialEndsAt) return true // trial sin fecha = activo
    return new Date(trialEndsAt) > new Date()
  }

  return false
}

/**
 * Obtiene informacion completa de la suscripcion de un club.
 */
export async function getSubscriptionInfo(clubId: string): Promise<SubscriptionInfo> {
  const club = await db.club.findUnique({
    where: { id: clubId },
    select: {
      subscriptionStatus: true,
      subscriptionTier: true,
      trialEndsAt: true,
    },
  })

  const status = (club?.subscriptionStatus ?? "trialing") as SubscriptionState
  const tier = (club?.subscriptionTier ?? "starter") as PlanKey
  const trialEndsAt = club?.trialEndsAt ?? null

  const isActive = isSubscriptionActive(status, trialEndsAt)
  const isGracePeriod = GRACE_STATUSES.includes(status)
  const isBlocked = !isActive && !isGracePeriod

  return { status, tier, trialEndsAt, isActive, isGracePeriod, isBlocked }
}

// --- Feature gating por plan ---

interface PlanLimits {
  courts: number    // -1 = ilimitado
  members: number   // -1 = ilimitado
  admins: number    // -1 = ilimitado
}

/**
 * Obtiene los limites del plan de un club.
 */
export function getPlanLimits(tier: PlanKey): PlanLimits {
  return PLAN_PRICES[tier]?.limits ?? PLAN_PRICES.starter.limits
}

/**
 * Verifica si un club puede crear mas pistas segun su plan.
 */
export async function canCreateCourt(clubId: string): Promise<{ allowed: boolean; reason?: string }> {
  const info = await getSubscriptionInfo(clubId)
  const limits = getPlanLimits(info.tier)

  if (limits.courts === -1) return { allowed: true }

  const courtCount = await db.court.count({ where: { clubId } })

  if (courtCount >= limits.courts) {
    return {
      allowed: false,
      reason: `Tu plan ${PLAN_PRICES[info.tier].name} permite hasta ${limits.courts} pistas. Actualiza tu plan para añadir mas.`,
    }
  }

  return { allowed: true }
}

/**
 * Verifica si un club puede registrar mas socios segun su plan.
 */
export async function canCreateMember(clubId: string): Promise<{ allowed: boolean; reason?: string }> {
  const info = await getSubscriptionInfo(clubId)
  const limits = getPlanLimits(info.tier)

  if (limits.members === -1) return { allowed: true }

  const memberCount = await db.user.count({
    where: { clubId, role: "PLAYER" },
  })

  if (memberCount >= limits.members) {
    return {
      allowed: false,
      reason: `Tu plan ${PLAN_PRICES[info.tier].name} permite hasta ${limits.members} socios. Actualiza tu plan para añadir mas.`,
    }
  }

  return { allowed: true }
}

/**
 * Verifica si el plan del club permite pagos online (Stripe Connect).
 * Solo disponible para Pro y Enterprise.
 */
export function canUseOnlinePayments(tier: PlanKey): boolean {
  return tier === "pro" || tier === "enterprise"
}

/**
 * Verifica si un club puede tener mas admins/staff segun su plan.
 */
export async function canCreateAdmin(clubId: string): Promise<{ allowed: boolean; reason?: string }> {
  const info = await getSubscriptionInfo(clubId)
  const limits = getPlanLimits(info.tier)

  if (limits.admins === -1) return { allowed: true }

  const adminCount = await db.user.count({
    where: {
      clubId,
      role: { in: ["CLUB_ADMIN", "STAFF"] },
    },
  })

  // No contar el SUPER_ADMIN (el creador del club)
  if (adminCount >= limits.admins) {
    return {
      allowed: false,
      reason: `Tu plan ${PLAN_PRICES[info.tier].name} permite hasta ${limits.admins} administrador${limits.admins !== 1 ? "es" : ""}. Actualiza tu plan para añadir mas.`,
    }
  }

  return { allowed: true }
}
