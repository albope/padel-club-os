import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDb } from '@/test/mocks/db'

const mockRefundCreate = vi.fn()
const mockAplicarRefundBooking = vi.fn().mockResolvedValue(true)

vi.mock('@/lib/db', () => ({ db: mockDb }))
vi.mock('@/lib/stripe', () => ({
  stripe: { refunds: { create: (...args: unknown[]) => mockRefundCreate(...args) } },
}))
vi.mock('@/lib/payment-sync', () => ({
  aplicarRefundBooking: (...args: unknown[]) => mockAplicarRefundBooking(...args),
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { enqueueBookingRefund, processRefundOperation } from './refunds'

const operation = {
  id: 'refund-op-1',
  paymentId: 'payment-1',
  bookingId: 'booking-1',
  clubId: 'club-1',
  stripePaymentIntentId: 'pi_123',
  stripeRefundId: null,
  idempotencyKey: 'booking-refund:payment-1',
  reason: 'Cancelacion',
  status: 'PROCESSING',
  attempts: 1,
  nextAttemptAt: new Date(),
  lockedAt: new Date(),
  lastError: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('cola durable de reembolsos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.payment.updateMany.mockResolvedValue({ count: 1 })
    mockDb.booking.updateMany.mockResolvedValue({ count: 1 })
    mockDb.refundOperation.update.mockResolvedValue(operation)
  })

  it('encola, reclama y confirma con una clave idempotente estable', async () => {
    mockDb.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      bookingId: 'booking-1',
      clubId: 'club-1',
      stripePaymentId: 'pi_123',
      status: 'succeeded',
      type: 'booking',
    })
    mockDb.refundOperation.upsert.mockResolvedValue({ id: operation.id, status: 'PENDING' })
    mockDb.refundOperation.updateMany.mockResolvedValue({ count: 1 })
    mockDb.refundOperation.findUnique.mockResolvedValue(operation)
    mockRefundCreate.mockResolvedValue({ id: 're_123' })

    const result = await enqueueBookingRefund('booking-1', 'Cancelacion solicitada')

    expect(result).toEqual({ status: 'succeeded', operationId: operation.id })
    expect(mockDb.refundOperation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          paymentId: 'payment-1',
          idempotencyKey: 'booking-refund:payment-1',
        }),
      }),
    )
    expect(mockRefundCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: 'pi_123',
        reverse_transfer: true,
      }),
      { idempotencyKey: 'booking-refund:payment-1' },
    )
    expect(mockAplicarRefundBooking).toHaveBeenCalledWith(expect.anything(), 'booking-1')
  })

  it('persiste el fallo y programa reintento sin afirmar que se reembolso', async () => {
    mockDb.refundOperation.updateMany.mockResolvedValue({ count: 1 })
    mockDb.refundOperation.findUnique.mockResolvedValue(operation)
    mockRefundCreate.mockRejectedValue(new Error('Stripe temporalmente no disponible'))

    const result = await processRefundOperation(operation.id)

    expect(result).toEqual({ status: 'failed', operationId: operation.id })
    expect(mockDb.refundOperation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          lastError: 'Stripe temporalmente no disponible',
        }),
      }),
    )
    expect(mockDb.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'refund_failed' } }),
    )
  })

  it('no crea una obligacion si no hay cobro online confirmado', async () => {
    mockDb.payment.findUnique.mockResolvedValue(null)

    await expect(enqueueBookingRefund('booking-1', 'Cancelacion')).resolves.toEqual({
      status: 'not_needed',
    })
    expect(mockDb.refundOperation.upsert).not.toHaveBeenCalled()
  })
})
