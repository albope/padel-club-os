import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { validarBody } from "@/lib/validation"
import { sincronizarEstadoPago } from "@/lib/payment-sync"
import { logger } from "@/lib/logger"
import * as z from "zod"

const GenerarPagosSchema = z.object({
  numPlayers: z.number().int().min(2, "Minimo 2 jugadores.").max(4, "Maximo 4 jugadores."),
  players: z.array(z.object({
    userId: z.string().optional(),
    guestName: z.string().max(100, "Nombre demasiado largo.").optional(),
  })).optional(),
})

/**
 * Genera BookingPayments para una reserva si no existen.
 * Para partidas abiertas FULL: crea uno por OpenMatchPlayer.
 * Para reservas normales: crea numPlayers registros con placeholders.
 */
async function autoGenerarPagos(bookingId: string, clubId: string) {
  const booking = await db.booking.findUnique({
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

  if (!booking || booking.clubId !== clubId) return null

  // Verificar si ya existen
  const existentes = await db.bookingPayment.count({
    where: { bookingId },
  })
  if (existentes > 0) return null

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
        clubId,
      })
    }
  } else {
    // Reserva normal: primer jugador es el titular
    pagosData.push({
      bookingId,
      userId: booking.userId,
      guestName: booking.userId ? null : (booking.guestName || "Jugador 1"),
      amount,
      clubId,
    })

    // Resto como placeholders
    for (let i = 2; i <= numPlayers; i++) {
      pagosData.push({
        bookingId,
        userId: null,
        guestName: `Jugador ${i}`,
        amount,
        clubId,
      })
    }
  }

  await db.bookingPayment.createMany({ data: pagosData })
}

// GET: Obtener desglose de pagos por jugador de una reserva
export async function GET(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const auth = await requireAuth("booking-payments:read")
    if (isAuthError(auth)) return auth

    const { bookingId } = params

    // Verificar que la reserva existe y pertenece al club
    const booking = await db.booking.findUnique({
      where: { id: bookingId, clubId: auth.session.user.clubId },
      select: { id: true, totalPrice: true, numPlayers: true, paymentStatus: true },
    })

    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 })
    }

    // Auto-generar pagos si no existen y la reserva no es exempt
    if (booking.paymentStatus !== "exempt") {
      await autoGenerarPagos(bookingId, auth.session.user.clubId)
    }

    const payments = await db.bookingPayment.findMany({
      where: { bookingId },
      include: {
        user: { select: { name: true } },
        collectedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      bookingId: booking.id,
      totalPrice: booking.totalPrice,
      numPlayers: booking.numPlayers || 4,
      paymentStatus: booking.paymentStatus,
      payments: payments.map(p => ({
        id: p.id,
        userId: p.userId,
        userName: p.user?.name || null,
        guestName: p.guestName,
        amount: p.amount,
        status: p.status,
        paidAt: p.paidAt,
        collectedByName: p.collectedBy?.name || null,
      })),
    })
  } catch (error) {
    logger.error("BOOKING_PAYMENTS", "Error al obtener pagos por jugador", { bookingId: params.bookingId }, error as Error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST: Regenerar desglose de pagos (cambiar numPlayers)
export async function POST(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const auth = await requireAuth("booking-payments:update")
    if (isAuthError(auth)) return auth

    const { bookingId } = params
    const body = await req.json()
    const result = validarBody(GenerarPagosSchema, body)
    if (!result.success) return result.response
    const { numPlayers, players } = result.data

    const booking = await db.booking.findUnique({
      where: { id: bookingId, clubId: auth.session.user.clubId },
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

    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 })
    }

    // Guard: bloquear regeneracion en reservas exentas o reembolsadas
    if (booking.paymentStatus === "exempt" || booking.paymentMethod === "exempt") {
      return NextResponse.json({ error: "No se pueden generar pagos para una reserva exenta." }, { status: 400 })
    }
    if (booking.paymentStatus === "refunded") {
      return NextResponse.json({ error: "No se pueden regenerar pagos de una reserva reembolsada." }, { status: 400 })
    }

    const amount = Math.round((booking.totalPrice / numPlayers) * 100) / 100

    await db.$transaction(async (tx) => {
      // Borrar pagos existentes
      await tx.bookingPayment.deleteMany({ where: { bookingId } })

      // Actualizar numPlayers en booking
      await tx.booking.update({
        where: { id: bookingId },
        data: { numPlayers },
      })

      const pagosData: Array<{
        bookingId: string
        userId: string | null
        guestName: string | null
        amount: number
        clubId: string
      }> = []

      if (players && players.length > 0) {
        // Usar los jugadores proporcionados
        for (let i = 0; i < numPlayers; i++) {
          const player = players[i]
          pagosData.push({
            bookingId,
            userId: player?.userId || null,
            guestName: player?.guestName || `Jugador ${i + 1}`,
            amount,
            clubId: auth.session.user.clubId,
          })
        }
      } else if (booking.openMatch && booking.openMatch.players.length >= 2) {
        // Partida abierta: usar jugadores reales
        for (const player of booking.openMatch.players) {
          pagosData.push({
            bookingId,
            userId: player.userId,
            guestName: null,
            amount,
            clubId: auth.session.user.clubId,
          })
        }
      } else {
        // Reserva normal
        pagosData.push({
          bookingId,
          userId: booking.userId,
          guestName: booking.userId ? null : (booking.guestName || "Jugador 1"),
          amount,
          clubId: auth.session.user.clubId,
        })
        for (let i = 2; i <= numPlayers; i++) {
          pagosData.push({
            bookingId,
            userId: null,
            guestName: `Jugador ${i}`,
            amount,
            clubId: auth.session.user.clubId,
          })
        }
      }

      await tx.bookingPayment.createMany({ data: pagosData })

      // Recalcular paymentStatus (protege exempt, recalcula desde BookingPayments)
      await sincronizarEstadoPago(tx, bookingId)
    })

    // Obtener los pagos generados
    const payments = await db.bookingPayment.findMany({
      where: { bookingId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    logger.info("BOOKING_PAYMENTS", "Pagos regenerados", { bookingId, numPlayers })

    return NextResponse.json({
      bookingId,
      totalPrice: booking.totalPrice,
      numPlayers,
      payments: payments.map(p => ({
        id: p.id,
        userId: p.userId,
        userName: p.user?.name || null,
        guestName: p.guestName,
        amount: p.amount,
        status: p.status,
        paidAt: p.paidAt,
      })),
    }, { status: 201 })
  } catch (error) {
    logger.error("BOOKING_PAYMENTS", "Error al regenerar pagos", { bookingId: params.bookingId }, error as Error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
