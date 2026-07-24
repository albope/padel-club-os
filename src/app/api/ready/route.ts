import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const LATEST_MIGRATION = '20260723030000_durable_refunds'
const REQUIRED_PRODUCTION_ENV = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
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
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_STARTER_MONTHLY',
  'STRIPE_PRICE_PRO_MONTHLY',
  'STRIPE_PRICE_ENTERPRISE_MONTHLY',
  'LEGAL_ENTITY_TYPE',
  'LEGAL_NAME',
  'LEGAL_TAX_ID',
  'LEGAL_ADDRESS',
  'LEGAL_EMAIL',
  'STRIPE_TAX_ENABLED',
  'TAX_HANDLING_CONFIRMED',
  'NEXT_PUBLIC_TEMA_MARCADOR',
] as const

export async function GET() {
  try {
    const [migrationRows, stuckRefunds] = await Promise.all([
      db.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name
        FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
        ORDER BY finished_at DESC
        LIMIT 1
      `,
      db.refundOperation.count({
        where: { status: 'FAILED', attempts: { gte: 5 } },
      }),
    ])

    const configurationIssues = process.env.NODE_ENV === 'production'
      ? [
          ...REQUIRED_PRODUCTION_ENV.filter((key) => !process.env[key]?.trim()),
          ...(process.env.RATE_LIMIT_BACKEND === 'upstash' ? [] : ['RATE_LIMIT_BACKEND']),
          ...(process.env.TAX_HANDLING_CONFIRMED === 'true' ? [] : ['TAX_HANDLING_CONFIRMED']),
          ...(process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? [] : ['STRIPE_SECRET_KEY_FORMAT']),
        ]
      : []
    const migrationReady = migrationRows[0]?.migration_name === LATEST_MIGRATION
    const ready = migrationReady && configurationIssues.length === 0

    return NextResponse.json(
      {
        status: ready ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'connected',
          migrations: migrationReady ? 'current' : 'outdated',
          configuration: configurationIssues.length === 0 ? 'configured' : 'incomplete',
          refunds: stuckRefunds === 0 ? 'healthy' : 'attention',
        },
      },
      {
        status: ready ? 200 : 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error) {
    logger.error('READINESS', 'Fallo el readiness check', { ruta: '/api/ready' }, error)
    return NextResponse.json(
      {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks: { database: 'disconnected' },
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
