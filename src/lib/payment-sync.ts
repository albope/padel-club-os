/**
 * payment-sync.ts
 *
 * Helper centralizado para sincronizacion de estados de pago
 * entre Booking, Payment y BookingPayment.
 *
 * Todas las funciones que reciben `tx` deben llamarse dentro de
 * una transaccion Prisma ($transaction callback).
 */

import type { PrismaClient } from "@prisma/client"

// Tipo del cliente transaccional de Prisma
type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]

/**
 * Recalcula Booking.paymentStatus a partir de los BookingPayments existentes.
 *
 * Reglas:
 * - Si paymentMethod === "exempt" o paymentStatus === "exempt" → no tocar
 * - Si todos los BookingPayments estan "paid" → "paid"
 * - En cualquier otro caso → "pending"
 *
 * @returns El nuevo paymentStatus o null si no hubo cambio (exempt/no encontrado)
 */
export async function sincronizarEstadoPago(
  tx: Tx,
  bookingId: string
): Promise<string | null> {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    select: { paymentMethod: true, paymentStatus: true },
  })

  if (!booking) return null

  // Reservas exentas: nunca modificar paymentStatus
  if (
    booking.paymentMethod === "exempt" ||
    booking.paymentStatus === "exempt"
  ) {
    return null
  }

  const allPayments = await tx.bookingPayment.findMany({
    where: { bookingId },
    select: { status: true },
  })

  const todosPagados =
    allPayments.length > 0 && allPayments.every((p) => p.status === "paid")

  const nuevoEstado = todosPagados ? "paid" : "pending"

  await tx.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: nuevoEstado },
  })

  return nuevoEstado
}

/**
 * Asegura que existan BookingPayments para un booking.
 * Si no existen, los crea. Si ya existen, no hace nada.
 *
 * Reutiliza la logica de autoGenerarPagos pero dentro de una transaccion.
 *
 * @returns Numero de BookingPayments (existentes o recien creados)
 */
export async function asegurarBookingPayments(
  tx: Tx,
  bookingId: string
): Promise<number> {
  const existentes = await tx.bookingPayment.count({
    where: { bookingId },
  })
  if (existentes > 0) return existentes

  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: {
      openMatch: {
        include: {
          players: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
      user: { select: { id: true, name: true } },
    },
  })

  if (!booking) return 0

  const numPlayers = booking.numPlayers || 4
  const amount = Math.round((booking.totalPrice / numPlayers) * 100) / 100

  const pagosData: Array<{
    bookingId: string
    userId: string | null
    guestName: string | null
    amount: number
    clubId: string
  }> = []

  // Si es partida abierta FULL, usar los jugadores reales
  if (booking.openMatch && booking.openMatch.players.length >= 2) {
    for (const player of booking.openMatch.players) {
      pagosData.push({
        bookingId,
        userId: player.userId,
        guestName: null,
        amount,
        clubId: booking.clubId,
      })
    }
  } else {
    // Reserva normal: primer jugador es el titular
    pagosData.push({
      bookingId,
      userId: booking.userId,
      guestName: booking.userId ? null : (booking.guestName || "Jugador 1"),
      amount,
      clubId: booking.clubId,
    })

    // Resto como placeholders
    for (let i = 2; i <= numPlayers; i++) {
      pagosData.push({
        bookingId,
        userId: null,
        guestName: `Jugador ${i}`,
        amount,
        clubId: booking.clubId,
      })
    }
  }

  await tx.bookingPayment.createMany({ data: pagosData })
  return pagosData.length
}

/**
 * Genera los datos de BookingPayment para una reserva nueva.
 * NO los escribe en DB — devuelve el array para usar en createMany.
 */
export function generarDatosPagoPorJugador(params: {
  bookingId: string
  clubId: string
  totalPrice: number
  numPlayers: number
  titularUserId: string | null
  titularGuestName?: string | null
}): Array<{
  bookingId: string
  userId: string | null
  guestName: string | null
  amount: number
  clubId: string
}> {
  const { bookingId, clubId, totalPrice, numPlayers, titularUserId, titularGuestName } = params
  const amountBase = Math.floor((totalPrice / numPlayers) * 100) / 100
  const remainder = Math.round((totalPrice - amountBase * numPlayers) * 100) / 100

  return [
    {
      bookingId,
      userId: titularUserId,
      guestName: titularUserId ? null : (titularGuestName || "Jugador 1"),
      amount: amountBase + remainder,
      clubId,
    },
    ...Array.from({ length: numPlayers - 1 }, (_, i) => ({
      bookingId,
      userId: null as string | null,
      guestName: `Jugador ${i + 2}`,
      amount: amountBase,
      clubId,
    })),
  ]
}
