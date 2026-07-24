import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { aplicarRefundBooking } from '@/lib/payment-sync'
import { stripe } from '@/lib/stripe'

const LOCK_TIMEOUT_MS = 10 * 60 * 1000
const MAX_RETRY_DELAY_MS = 24 * 60 * 60 * 1000

export type RefundResult =
  | { status: 'not_needed' | 'already_refunded' }
  | { status: 'pending' | 'succeeded' | 'failed'; operationId: string }

function cleanError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/[\r\n\t]+/g, ' ').slice(0, 1000)
}

/**
 * Registra primero la obligacion de reembolso y despues intenta procesarla.
 * La fila durable permite reintentar aunque Stripe o la instancia fallen.
 */
export async function enqueueBookingRefund(
  bookingId: string,
  reason: string,
): Promise<RefundResult> {
  const payment = await db.payment.findUnique({
    where: { bookingId },
    select: {
      id: true,
      bookingId: true,
      clubId: true,
      stripePaymentId: true,
      status: true,
      type: true,
    },
  })

  if (!payment?.bookingId || !payment.stripePaymentId || payment.type !== 'booking') {
    return { status: 'not_needed' }
  }
  if (payment.status === 'refunded') return { status: 'already_refunded' }
  if (!['succeeded', 'refund_pending', 'refund_failed'].includes(payment.status)) {
    return { status: 'not_needed' }
  }

  const operation = await db.$transaction(async (tx) => {
    const queued = await tx.refundOperation.upsert({
      where: { paymentId: payment.id },
      create: {
        paymentId: payment.id,
        bookingId: payment.bookingId!,
        clubId: payment.clubId,
        stripePaymentIntentId: payment.stripePaymentId!,
        idempotencyKey: `booking-refund:${payment.id}`,
        reason: reason.trim().slice(0, 300),
      },
      update: {},
      select: { id: true, status: true },
    })

    if (queued.status !== 'SUCCEEDED') {
      await tx.payment.updateMany({
        where: { id: payment.id, status: { in: ['succeeded', 'refund_failed'] } },
        data: { status: 'refund_pending' },
      })
      await tx.booking.updateMany({
        where: {
          id: payment.bookingId!,
          paymentStatus: { in: ['paid', 'pending', 'refund_failed'] },
        },
        data: { paymentStatus: 'refund_pending' },
      })
    }
    return queued
  })

  if (operation.status === 'SUCCEEDED') {
    return { status: 'succeeded', operationId: operation.id }
  }
  return processRefundOperation(operation.id)
}

/**
 * Reclama una operacion de forma atomica. Un worker caido libera el lock
 * implicitamente tras diez minutos y Stripe evita duplicados por idempotencyKey.
 */
export async function processRefundOperation(operationId: string): Promise<RefundResult> {
  const now = new Date()
  const staleLock = new Date(now.getTime() - LOCK_TIMEOUT_MS)
  const claimed = await db.refundOperation.updateMany({
    where: {
      id: operationId,
      OR: [
        { status: { in: ['PENDING', 'FAILED'] }, nextAttemptAt: { lte: now } },
        { status: 'PROCESSING', lockedAt: { lt: staleLock } },
      ],
    },
    data: {
      status: 'PROCESSING',
      lockedAt: now,
      attempts: { increment: 1 },
      lastError: null,
    },
  })

  if (claimed.count === 0) {
    const existing = await db.refundOperation.findUnique({
      where: { id: operationId },
      select: { status: true },
    })
    if (existing?.status === 'SUCCEEDED') {
      return { status: 'succeeded', operationId }
    }
    return { status: 'pending', operationId }
  }

  const operation = await db.refundOperation.findUnique({
    where: { id: operationId },
  })
  if (!operation) return { status: 'failed', operationId }

  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: operation.stripePaymentIntentId,
        reverse_transfer: true,
        refund_application_fee: false,
        metadata: {
          bookingId: operation.bookingId,
          refundOperationId: operation.id,
        },
      },
      { idempotencyKey: operation.idempotencyKey },
    )

    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: operation.paymentId },
        data: { status: 'refunded' },
      })
      await aplicarRefundBooking(tx, operation.bookingId)
      await tx.refundOperation.update({
        where: { id: operation.id },
        data: {
          status: 'SUCCEEDED',
          stripeRefundId: refund.id,
          completedAt: new Date(),
          lockedAt: null,
          lastError: null,
        },
      })
    })
    logger.info('BOOKING_REFUND', 'Reembolso confirmado por Stripe', {
      bookingId: operation.bookingId,
      paymentId: operation.paymentId,
      refundOperationId: operation.id,
      stripeRefundId: refund.id,
    })
    return { status: 'succeeded', operationId }
  } catch (error) {
    const delay = Math.min(
      MAX_RETRY_DELAY_MS,
      60_000 * 2 ** Math.min(operation.attempts, 10),
    )
    const lastError = cleanError(error)
    await db.$transaction([
      db.refundOperation.update({
        where: { id: operation.id },
        data: {
          status: 'FAILED',
          lockedAt: null,
          lastError,
          nextAttemptAt: new Date(Date.now() + delay),
        },
      }),
      db.payment.updateMany({
        where: { id: operation.paymentId, status: 'refund_pending' },
        data: { status: 'refund_failed' },
      }),
      db.booking.updateMany({
        where: { id: operation.bookingId, paymentStatus: 'refund_pending' },
        data: { paymentStatus: 'refund_failed' },
      }),
    ])
    logger.error('BOOKING_REFUND', 'Stripe no confirmo el reembolso; queda en reintento', {
      bookingId: operation.bookingId,
      paymentId: operation.paymentId,
      refundOperationId: operation.id,
      attempts: operation.attempts,
    }, error)
    return { status: 'failed', operationId }
  }
}

export async function processPendingRefunds(limit = 25) {
  const now = new Date()
  const staleLock = new Date(now.getTime() - LOCK_TIMEOUT_MS)
  // Reconciliacion defensiva: recupera cancelaciones que se confirmaron en DB
  // justo antes de una caida de proceso que impidio encolar el reembolso.
  const missing = await db.payment.findMany({
    where: {
      type: 'booking',
      status: 'succeeded',
      stripePaymentId: { not: null },
      booking: { status: 'cancelled' },
      refundOperations: { none: {} },
    },
    select: { bookingId: true },
    take: Math.min(Math.max(limit, 1), 100),
  })
  const reconciled: RefundResult[] = []
  for (const payment of missing) {
    if (payment.bookingId) {
      reconciled.push(await enqueueBookingRefund(
        payment.bookingId,
        'Reconciliacion automatica de reserva cancelada',
      ))
    }
  }

  const operations = await db.refundOperation.findMany({
    where: {
      OR: [
        { status: { in: ['PENDING', 'FAILED'] }, nextAttemptAt: { lte: now } },
        { status: 'PROCESSING', lockedAt: { lt: staleLock } },
      ],
    },
    select: { id: true },
    orderBy: { nextAttemptAt: 'asc' },
    take: Math.min(Math.max(limit, 1), 100),
  })

  const results: RefundResult[] = [...reconciled]
  for (const operation of operations) {
    results.push(await processRefundOperation(operation.id))
  }
  return results
}
