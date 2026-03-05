/**
 * payment-states.ts
 *
 * Contrato unico de estados de pago para los tres modelos:
 * - Booking.paymentStatus
 * - Payment.status
 * - BookingPayment.status
 *
 * Define transiciones validas y expone guards para validarlas.
 */

// =============================================================================
// TIPOS DE ESTADO
// =============================================================================

export type BookingPaymentStatus = "pending" | "paid" | "refunded" | "exempt"
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded"
export type BookingPaymentItemStatus = "pending" | "paid" | "refunded"

// =============================================================================
// TRANSICIONES VALIDAS
// =============================================================================

/**
 * Booking.paymentStatus:
 *   pending  -> paid | refunded  (nunca a exempt; exempt es inmutable)
 *   paid     -> refunded
 *   refunded -> (terminal)
 *   exempt   -> (inmutable, nunca cambia)
 */
const BOOKING_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["paid", "refunded"],
  paid: ["refunded"],
  refunded: [],
  exempt: [],
}

/**
 * Payment.status:
 *   pending   -> succeeded | failed
 *   succeeded -> refunded
 *   failed    -> (terminal)
 *   refunded  -> (terminal)
 */
const PAYMENT_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["succeeded", "failed"],
  succeeded: ["refunded"],
  failed: [],
  refunded: [],
}

/**
 * BookingPayment.status:
 *   pending  -> paid | refunded
 *   paid     -> refunded | pending (deshacer cobro manual)
 *   refunded -> (terminal)
 */
const BOOKING_PAYMENT_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["paid", "refunded"],
  paid: ["refunded", "pending"],
  refunded: [],
}

// =============================================================================
// GUARDS
// =============================================================================

export function canTransitionBooking(
  current: string | null | undefined,
  next: string
): boolean {
  const estado = current || "pending"
  return BOOKING_TRANSITIONS[estado]?.includes(next) ?? false
}

export function canTransitionPayment(
  current: string | null | undefined,
  next: string
): boolean {
  const estado = current || "pending"
  return PAYMENT_TRANSITIONS[estado]?.includes(next) ?? false
}

export function canTransitionBookingPayment(
  current: string | null | undefined,
  next: string
): boolean {
  const estado = current || "pending"
  return BOOKING_PAYMENT_TRANSITIONS[estado]?.includes(next) ?? false
}

// =============================================================================
// HELPERS
// =============================================================================

/** Devuelve true si el booking esta en un estado terminal de pago (no se puede cobrar) */
export function isBookingPaymentTerminal(status: string | null | undefined): boolean {
  const s = status || "pending"
  return s === "refunded" || s === "exempt"
}

/** Devuelve true si el booking esta cancelado o su pago es terminal */
export function isBookingLocked(bookingStatus: string, paymentStatus: string | null | undefined): boolean {
  return bookingStatus === "cancelled" || isBookingPaymentTerminal(paymentStatus)
}
