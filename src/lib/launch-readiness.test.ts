import { describe, expect, it } from 'vitest'
import { evaluateLaunchReadiness, type Environment } from './launch-readiness'

function validEnv(stage: 'pilot' | 'commercial'): Environment {
  return {
    LAUNCH_STAGE: stage,
    DATABASE_URL: 'postgresql://db',
    DIRECT_URL: 'postgresql://direct',
    AUTH_SECRET: 'a'.repeat(32),
    NEXTAUTH_URL: 'https://padelclubos.com',
    NEXT_PUBLIC_APP_URL: 'https://padelclubos.com',
    STRIPE_SECRET_KEY: stage === 'pilot' ? 'sk_test_example' : 'sk_live_example',
    STRIPE_WEBHOOK_SECRET: 'whsec_example',
    STRIPE_PRICE_STARTER_MONTHLY: 'price_starter',
    STRIPE_PRICE_PRO_MONTHLY: 'price_pro',
    STRIPE_PRICE_ENTERPRISE_MONTHLY: 'price_enterprise',
    STRIPE_PORTAL_CONFIGURATION_ID: 'bpc_example',
    RESEND_API_KEY: 're_example',
    CONTACT_EMAIL: 'contacto@padelclubos.com',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'public',
    VAPID_PRIVATE_KEY: 'private',
    VAPID_SUBJECT: 'mailto:contacto@padelclubos.com',
    BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_example',
    CRON_SECRET: 'c'.repeat(32),
    HEARTBEAT_URL_REMINDERS: 'https://healthchecks.io/reminders',
    HEARTBEAT_URL_RECURRING: 'https://healthchecks.io/recurring',
    HEARTBEAT_URL_REFUNDS: 'https://healthchecks.io/refunds',
    SENTRY_DSN: 'https://public@sentry.example/1',
    NEXT_PUBLIC_SENTRY_DSN: 'https://public@sentry.example/1',
    LEGAL_ENTITY_TYPE: 'company',
    LEGAL_NAME: 'BORT PEREZ MULTI GESTION SOCIEDAD LIMITADA',
    LEGAL_TAX_ID: 'B98629470',
    LEGAL_PUBLIC_ADDRESS: 'Avenida Carlos Marx, 1, 12 E, Mislata',
    LEGAL_REGISTRY_DETAILS: 'Registro Mercantil de Valencia, tomo 9786',
    LEGAL_EMAIL: 'legal@padelclubos.com',
    STRIPE_TAX_ENABLED: 'false',
    TAX_HANDLING_CONFIRMED: stage === 'commercial' ? 'true' : 'false',
    RATE_LIMIT_BACKEND: 'database',
  }
}

describe('evaluateLaunchReadiness', () => {
  it('admite un piloto con Stripe TEST y sin confirmacion fiscal comercial', () => {
    expect(evaluateLaunchReadiness(validEnv('pilot'))).toEqual({
      stage: 'pilot',
      issues: [],
    })
  })

  it('mantiene el lanzamiento comercial cerrado con Stripe TEST', () => {
    const env = validEnv('commercial')
    env.STRIPE_SECRET_KEY = 'sk_test_example'
    env.TAX_HANDLING_CONFIRMED = 'false'

    const result = evaluateLaunchReadiness(env)
    expect(result.stage).toBe('commercial')
    expect(result.issues).toContain(
      'STRIPE_SECRET_KEY debe usar sk_live_ en etapa commercial',
    )
    expect(result.issues).toContain(
      'TAX_HANDLING_CONFIRMED debe ser true antes de activar cobros comerciales',
    )
  })

  it('usa commercial por defecto para fallar de forma segura', () => {
    const env = validEnv('commercial')
    delete env.LAUNCH_STAGE

    expect(evaluateLaunchReadiness(env).stage).toBe('commercial')
  })

  it('bloquea una etapa desconocida', () => {
    const env = validEnv('commercial')
    env.LAUNCH_STAGE = 'demo'

    expect(evaluateLaunchReadiness(env).issues).toContain(
      'LAUNCH_STAGE debe ser pilot o commercial',
    )
  })
})
