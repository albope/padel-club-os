import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { evaluateLaunchReadiness } from '@/lib/launch-readiness'

export const dynamic = 'force-dynamic'

const LATEST_MIGRATION = '20260725000000_presential_bookings_and_database_rate_limit'
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

    const launch = evaluateLaunchReadiness(process.env)
    const configurationIssues = process.env.NODE_ENV === 'production' ? launch.issues : []
    const migrationReady = migrationRows[0]?.migration_name === LATEST_MIGRATION
    const ready = migrationReady && configurationIssues.length === 0

    return NextResponse.json(
      {
        status: ready ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        launchStage: launch.stage,
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
