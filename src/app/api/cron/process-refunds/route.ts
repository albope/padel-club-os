import { NextResponse } from 'next/server'
import { pingHeartbeat } from '@/lib/heartbeat'
import { logger } from '@/lib/logger'
import { processPendingRefunds } from '@/lib/refunds'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const results = await processPendingRefunds(50)
    const summary = results.reduce(
      (acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    await pingHeartbeat(process.env.HEARTBEAT_URL_REFUNDS)
    return NextResponse.json({ processed: results.length, summary })
  } catch (error) {
    logger.error('REFUND_CRON', 'Error procesando la cola de reembolsos', {
      ruta: '/api/cron/process-refunds',
    }, error)
    return NextResponse.json({ error: 'No se pudo procesar la cola.' }, { status: 500 })
  }
}
