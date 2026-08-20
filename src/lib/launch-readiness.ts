export const LAUNCH_STAGES = ['pilot', 'commercial'] as const

export type LaunchStage = (typeof LAUNCH_STAGES)[number]
export type Environment = Record<string, string | undefined>

const REQUIRED_ENV = [
  'DATABASE_URL',
  'DIRECT_URL',
  'AUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_STARTER_MONTHLY',
  'STRIPE_PRICE_PRO_MONTHLY',
  'STRIPE_PRICE_ENTERPRISE_MONTHLY',
  'STRIPE_PORTAL_CONFIGURATION_ID',
  'RESEND_API_KEY',
  'CONTACT_EMAIL',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
  'BLOB_READ_WRITE_TOKEN',
  'CRON_SECRET',
  'HEARTBEAT_URL_REMINDERS',
  'HEARTBEAT_URL_RECURRING',
  'HEARTBEAT_URL_REFUNDS',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'LEGAL_ENTITY_TYPE',
  'LEGAL_NAME',
  'LEGAL_TAX_ID',
  'LEGAL_PUBLIC_ADDRESS',
  'LEGAL_REGISTRY_DETAILS',
  'LEGAL_EMAIL',
  'STRIPE_TAX_ENABLED',
  'TAX_HANDLING_CONFIRMED',
] as const

const HTTPS_KEYS = [
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'HEARTBEAT_URL_REMINDERS',
  'HEARTBEAT_URL_RECURRING',
  'HEARTBEAT_URL_REFUNDS',
] as const

const PREFIXES = {
  STRIPE_WEBHOOK_SECRET: 'whsec_',
  STRIPE_PRICE_STARTER_MONTHLY: 'price_',
  STRIPE_PRICE_PRO_MONTHLY: 'price_',
  STRIPE_PRICE_ENTERPRISE_MONTHLY: 'price_',
  STRIPE_PORTAL_CONFIGURATION_ID: 'bpc_',
  RESEND_API_KEY: 're_',
  BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_',
} as const

function value(env: Environment, key: string) {
  return env[key]?.trim() || ''
}

export function resolveLaunchStage(env: Environment): {
  stage: LaunchStage
  issues: string[]
} {
  const configured = value(env, 'LAUNCH_STAGE')
  if (!configured) return { stage: 'commercial', issues: [] }
  if (LAUNCH_STAGES.includes(configured as LaunchStage)) {
    return { stage: configured as LaunchStage, issues: [] }
  }
  return {
    stage: 'commercial',
    issues: ['LAUNCH_STAGE debe ser pilot o commercial'],
  }
}

export function evaluateLaunchReadiness(env: Environment) {
  const { stage, issues } = resolveLaunchStage(env)
  const missing = REQUIRED_ENV.filter((key) => !value(env, key))
  if (missing.length) issues.push(`Faltan variables: ${missing.join(', ')}`)

  for (const key of HTTPS_KEYS) {
    const configured = value(env, key)
    if (configured && !configured.startsWith('https://')) {
      issues.push(`${key} debe usar https://`)
    }
  }

  for (const [key, prefix] of Object.entries(PREFIXES)) {
    const configured = value(env, key)
    if (configured && !configured.startsWith(prefix)) {
      issues.push(`${key} no tiene formato ${prefix}`)
    }
  }

  const stripePrefix = stage === 'pilot' ? 'sk_test_' : 'sk_live_'
  const stripeSecret = value(env, 'STRIPE_SECRET_KEY')
  if (stripeSecret && !stripeSecret.startsWith(stripePrefix)) {
    issues.push(`STRIPE_SECRET_KEY debe usar ${stripePrefix} en etapa ${stage}`)
  }

  for (const key of ['STRIPE_TAX_ENABLED', 'TAX_HANDLING_CONFIRMED']) {
    const configured = value(env, key)
    if (configured && !['true', 'false'].includes(configured)) {
      issues.push(`${key} debe ser true o false`)
    }
  }
  if (stage === 'commercial' && value(env, 'TAX_HANDLING_CONFIRMED') !== 'true') {
    issues.push(
      'TAX_HANDLING_CONFIRMED debe ser true antes de activar cobros comerciales',
    )
  }

  const rateLimitBackend = value(env, 'RATE_LIMIT_BACKEND') || 'database'
  if (!['database', 'upstash'].includes(rateLimitBackend)) {
    issues.push('RATE_LIMIT_BACKEND debe ser database o upstash en produccion')
  }
  if (rateLimitBackend === 'upstash') {
    for (const key of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) {
      if (!value(env, key)) issues.push(`Falta variable: ${key}`)
    }
    const upstashUrl = value(env, 'UPSTASH_REDIS_REST_URL')
    if (upstashUrl && !upstashUrl.startsWith('https://')) {
      issues.push('UPSTASH_REDIS_REST_URL debe usar https://')
    }
    const upstashToken = value(env, 'UPSTASH_REDIS_REST_TOKEN')
    if (upstashToken && upstashToken.length < 20) {
      issues.push('UPSTASH_REDIS_REST_TOKEN parece incompleto')
    }
  }

  if (!['individual', 'company'].includes(value(env, 'LEGAL_ENTITY_TYPE'))) {
    issues.push('LEGAL_ENTITY_TYPE debe ser individual o company')
  }
  if (value(env, 'LEGAL_ENTITY_TYPE') !== 'company') {
    issues.push('LEGAL_ENTITY_TYPE debe ser company para el lanzamiento actual')
  }
  if (value(env, 'AUTH_SECRET').length < 32) {
    issues.push('AUTH_SECRET debe tener al menos 32 caracteres')
  }
  if (value(env, 'CRON_SECRET').length < 32) {
    issues.push('CRON_SECRET debe tener al menos 32 caracteres')
  }

  const nextAuthUrl = value(env, 'NEXTAUTH_URL')
  const publicAppUrl = value(env, 'NEXT_PUBLIC_APP_URL')
  if (nextAuthUrl && publicAppUrl) {
    try {
      if (new URL(nextAuthUrl).origin !== new URL(publicAppUrl).origin) {
        issues.push('NEXTAUTH_URL y NEXT_PUBLIC_APP_URL deben tener el mismo origen')
      }
    } catch {
      issues.push('NEXTAUTH_URL o NEXT_PUBLIC_APP_URL no es una URL valida')
    }
  }

  for (const key of ['CONTACT_EMAIL', 'LEGAL_EMAIL']) {
    const configured = value(env, key)
    if (configured && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configured)) {
      issues.push(`${key} no tiene un formato de email valido`)
    }
  }
  const vapidSubject = value(env, 'VAPID_SUBJECT')
  if (vapidSubject && !/^(mailto:|https:\/\/)/.test(vapidSubject)) {
    issues.push('VAPID_SUBJECT debe empezar por mailto: o https://')
  }
  if (value(env, 'LEGAL_TAX_ID').length < 6) {
    issues.push('LEGAL_TAX_ID parece incompleto')
  }

  const placeholderPattern = /(?:tudominio|tu nombre|pendiente|completar|xxx|example)/i
  for (const key of [
    'LEGAL_NAME',
    'LEGAL_TAX_ID',
    'LEGAL_PUBLIC_ADDRESS',
    'LEGAL_REGISTRY_DETAILS',
    'LEGAL_EMAIL',
    'CONTACT_EMAIL',
  ]) {
    if (placeholderPattern.test(value(env, key))) {
      issues.push(`${key} contiene un valor de ejemplo`)
    }
  }

  return { stage, issues: [...new Set(issues)] }
}
