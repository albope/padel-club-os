/**
 * Tests unitarios para payment-states.ts y payment-sync.ts
 * (funciones puras + funciones con tx mock directo, sin vi.mock global)
 */
import { describe, it, expect, vi } from "vitest"

import {
  canTransitionBooking,
  canTransitionPayment,
  canTransitionBookingPayment,
  isBookingPaymentTerminal,
  isBookingLocked,
} from "@/lib/payment-states"

import {
  sincronizarEstadoPago,
  aplicarRefundBooking,
  marcarBookingPaymentsRefunded,
} from "@/lib/payment-sync"

// =============================================================================
// Guards de transicion
// =============================================================================

describe("canTransitionBooking", () => {
  it("pending -> paid: valida", () => {
    expect(canTransitionBooking("pending", "paid")).toBe(true)
  })
  it("pending -> refunded: valida", () => {
    expect(canTransitionBooking("pending", "refunded")).toBe(true)
  })
  it("paid -> refunded: valida", () => {
    expect(canTransitionBooking("paid", "refunded")).toBe(true)
  })
  it("refunded -> paid: invalida (terminal)", () => {
    expect(canTransitionBooking("refunded", "paid")).toBe(false)
  })
  it("exempt -> paid: invalida (inmutable)", () => {
    expect(canTransitionBooking("exempt", "paid")).toBe(false)
  })
  it("exempt -> refunded: invalida (inmutable)", () => {
    expect(canTransitionBooking("exempt", "refunded")).toBe(false)
  })
  it("null/undefined trata como pending", () => {
    expect(canTransitionBooking(null, "paid")).toBe(true)
    expect(canTransitionBooking(undefined, "paid")).toBe(true)
  })
})

describe("canTransitionPayment", () => {
  it("pending -> succeeded: valida", () => {
    expect(canTransitionPayment("pending", "succeeded")).toBe(true)
  })
  it("pending -> failed: valida", () => {
    expect(canTransitionPayment("pending", "failed")).toBe(true)
  })
  it("succeeded -> refunded: valida", () => {
    expect(canTransitionPayment("succeeded", "refunded")).toBe(true)
  })
  it("failed -> succeeded: invalida (terminal)", () => {
    expect(canTransitionPayment("failed", "succeeded")).toBe(false)
  })
  it("refunded -> succeeded: invalida (terminal)", () => {
    expect(canTransitionPayment("refunded", "succeeded")).toBe(false)
  })
})

describe("canTransitionBookingPayment", () => {
  it("pending -> paid: valida", () => {
    expect(canTransitionBookingPayment("pending", "paid")).toBe(true)
  })
  it("pending -> refunded: valida", () => {
    expect(canTransitionBookingPayment("pending", "refunded")).toBe(true)
  })
  it("paid -> refunded: valida", () => {
    expect(canTransitionBookingPayment("paid", "refunded")).toBe(true)
  })
  it("paid -> pending: valida (deshacer cobro manual)", () => {
    expect(canTransitionBookingPayment("paid", "pending")).toBe(true)
  })
  it("refunded -> paid: invalida (terminal)", () => {
    expect(canTransitionBookingPayment("refunded", "paid")).toBe(false)
  })
  it("refunded -> pending: invalida (terminal)", () => {
    expect(canTransitionBookingPayment("refunded", "pending")).toBe(false)
  })
})

describe("isBookingPaymentTerminal", () => {
  it("refunded es terminal", () => {
    expect(isBookingPaymentTerminal("refunded")).toBe(true)
  })
  it("exempt es terminal", () => {
    expect(isBookingPaymentTerminal("exempt")).toBe(true)
  })
  it("pending no es terminal", () => {
    expect(isBookingPaymentTerminal("pending")).toBe(false)
  })
  it("paid no es terminal", () => {
    expect(isBookingPaymentTerminal("paid")).toBe(false)
  })
})

describe("isBookingLocked", () => {
  it("cancelled + pending: locked", () => {
    expect(isBookingLocked("cancelled", "pending")).toBe(true)
  })
  it("confirmed + refunded: locked", () => {
    expect(isBookingLocked("confirmed", "refunded")).toBe(true)
  })
  it("confirmed + pending: not locked", () => {
    expect(isBookingLocked("confirmed", "pending")).toBe(false)
  })
})

// =============================================================================
// payment-sync.ts — tests con tx mock directo
// =============================================================================

describe("sincronizarEstadoPago", () => {
  it("recalcula a paid si todos BookingPayments estan paid", async () => {
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue({ paymentMethod: "presential", paymentStatus: "pending" }),
        update: vi.fn().mockResolvedValue({}),
      },
      bookingPayment: {
        findMany: vi.fn().mockResolvedValue([{ status: "paid" }, { status: "paid" }]),
      },
    }
    const result = await sincronizarEstadoPago(tx as never, "b1")
    expect(result).toBe("paid")
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { paymentStatus: "paid" },
    })
  })

  it("recalcula a pending si algun BookingPayment no esta paid", async () => {
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue({ paymentMethod: "presential", paymentStatus: "paid" }),
        update: vi.fn().mockResolvedValue({}),
      },
      bookingPayment: {
        findMany: vi.fn().mockResolvedValue([{ status: "paid" }, { status: "pending" }]),
      },
    }
    const result = await sincronizarEstadoPago(tx as never, "b1")
    expect(result).toBe("pending")
  })

  it("no toca bookings exempt", async () => {
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue({ paymentMethod: "exempt", paymentStatus: "exempt" }),
        update: vi.fn(),
      },
      bookingPayment: { findMany: vi.fn() },
    }
    const result = await sincronizarEstadoPago(tx as never, "b1")
    expect(result).toBeNull()
    expect(tx.booking.update).not.toHaveBeenCalled()
  })
})

describe("aplicarRefundBooking", () => {
  it("transiciona paid -> refunded y marca BookingPayments", async () => {
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue({ paymentStatus: "paid" }),
        update: vi.fn().mockResolvedValue({}),
      },
      bookingPayment: {
        updateMany: vi.fn().mockResolvedValue({ count: 4 }),
      },
    }
    const result = await aplicarRefundBooking(tx as never, "b1")
    expect(result).toBe(true)
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { paymentStatus: "refunded" },
    })
    expect(tx.bookingPayment.updateMany).toHaveBeenCalledWith({
      where: { bookingId: "b1", status: "paid" },
      data: { status: "refunded" },
    })
  })

  it("no transiciona exempt -> refunded (retorna false)", async () => {
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue({ paymentStatus: "exempt" }),
        update: vi.fn(),
      },
      bookingPayment: { updateMany: vi.fn() },
    }
    const result = await aplicarRefundBooking(tx as never, "b1")
    expect(result).toBe(false)
    expect(tx.booking.update).not.toHaveBeenCalled()
  })

  it("retorna false si booking no existe", async () => {
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
      bookingPayment: { updateMany: vi.fn() },
    }
    const result = await aplicarRefundBooking(tx as never, "b1")
    expect(result).toBe(false)
  })

  it("transiciona pending -> refunded (cancel sin cobro)", async () => {
    const tx = {
      booking: {
        findUnique: vi.fn().mockResolvedValue({ paymentStatus: "pending" }),
        update: vi.fn().mockResolvedValue({}),
      },
      bookingPayment: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    }
    const result = await aplicarRefundBooking(tx as never, "b1")
    expect(result).toBe(true)
  })
})

describe("marcarBookingPaymentsRefunded", () => {
  it("solo actualiza los que estan paid (no pending)", async () => {
    const tx = {
      bookingPayment: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    }
    const count = await marcarBookingPaymentsRefunded(tx as never, "b1")
    expect(count).toBe(2)
    expect(tx.bookingPayment.updateMany).toHaveBeenCalledWith({
      where: { bookingId: "b1", status: "paid" },
      data: { status: "refunded" },
    })
  })
})
