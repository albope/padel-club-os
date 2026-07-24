import { NextResponse } from "next/server"
import { constructWebhookEvent, getPlanKeyFromPriceId, stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import { enviarEmailConfirmacionReserva } from "@/lib/email"
import { asegurarBookingPayments, aplicarRefundBooking } from "@/lib/payment-sync"
import { logger } from "@/lib/logger"
import { enqueueBookingRefund } from "@/lib/refunds"
import { Prisma } from "@prisma/client"
import type Stripe from "stripe"

const WEBHOOK_LOCK_MS = 10 * 60 * 1000

async function claimWebhookEvent(event: Stripe.Event): Promise<boolean> {
  // Algunos consumidores de la funcion (tests unitarios o scripts antiguos)
  // usan un Prisma parcial. En runtime el modelo siempre existe tras migrar.
  const eventStore = db.stripeWebhookEvent
  if (!eventStore?.create) return true
  try {
    await eventStore.create({
      data: { eventId: event.id, type: event.type },
    })
    return true
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error
    }
  }

  const existing = await eventStore.findUnique({
    where: { eventId: event.id },
  })
  if (!existing || existing.status === "SUCCEEDED") return false
  if (
    existing.status === "PROCESSING"
    && existing.updatedAt.getTime() > Date.now() - WEBHOOK_LOCK_MS
  ) {
    return false
  }

  const claimed = await eventStore.updateMany({
    where: {
      eventId: event.id,
      status: existing.status,
      updatedAt: existing.updatedAt,
    },
    data: {
      status: "PROCESSING",
      attempts: { increment: 1 },
      lastError: null,
    },
  })
  return claimed.count === 1
}

function webhookError(error: unknown) {
  return (error instanceof Error ? error.message : String(error))
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 1000)
}

async function sincronizarSuscripcion(
  subscription: Stripe.Subscription,
  fallbackClubId?: string
) {
  let clubId = subscription.metadata?.clubId || fallbackClubId

  if (!clubId) {
    const club = await db.club.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      select: { id: true },
    })
    clubId = club?.id
  }

  if (!clubId) return

  const priceId = subscription.items.data[0]?.price?.id
  const planKey = priceId ? getPlanKeyFromPriceId(priceId) : null

  await db.club.update({
    where: { id: clubId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      ...(planKey && { subscriptionTier: planKey }),
    },
  })
}

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Falta firma de Stripe" },
      { status: 400 }
    )
  }

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    logger.error("STRIPE_WEBHOOK_SIGNATURE", "Firma de webhook invalida", { ruta: "/api/stripe/webhook" }, err)
    return NextResponse.json(
      { error: "Firma invalida" },
      { status: 400 }
    )
  }

  let claimed = false
  try {
    claimed = await claimWebhookEvent(event)
    if (!claimed) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const clubId = session.metadata?.clubId

        // Pago de suscripcion SaaS
        if (session.mode === "subscription" && clubId) {
          const subscription = typeof session.subscription === "string"
            ? await stripe.subscriptions.retrieve(session.subscription)
            : session.subscription

          if (subscription) {
            await sincronizarSuscripcion(subscription, clubId)
          }
        }

        // Pago de reserva via Stripe Connect
        if (session.mode === "payment" && session.metadata?.type === "booking_payment") {
          const bookingId = session.metadata.bookingId
          const paymentClubId = session.metadata.clubId
          const userId = session.metadata.userId

          if (!bookingId || !paymentClubId || typeof session.payment_intent !== "string") break

          // Idempotencia: verificar que no existe ya un pago para esta reserva
          const existingPayment = await db.payment.findUnique({
            where: { bookingId },
          })
          if (existingPayment) break

          // Transaccion atomica con guard de booking confirmada. El Payment se
          // conserva tambien si el pago llego despues de cancelar: es la prueba
          // durable de la obligacion de reembolso.
          const updatedBooking = await db.$transaction(async (tx) => {
            const currentBooking = await tx.booking.findUnique({
              where: { id: bookingId },
              select: { status: true },
            })
            if (!currentBooking) return null

            // Guard atomico: solo marcar paid si booking sigue confirmada
            const { count } = await tx.booking.updateMany({
              where: { id: bookingId, status: "confirmed" },
              data: {
                paymentStatus: "paid",
                checkoutSessionId: null,
                checkoutSessionExpiresAt: null,
                checkoutLockUntil: null,
              },
            })

            // Crear registro de pago
            await tx.payment.create({
              data: {
                amount: (session.amount_total ?? 0) / 100,
                currency: session.currency?.toUpperCase() ?? "EUR",
                status: "succeeded",
                type: "booking",
                stripePaymentId: session.payment_intent as string,
                bookingId,
                userId,
                clubId: paymentClubId,
              },
            })

            if (count === 0) return null // Booking cancelada

            // Leer booking actualizado para email/notificacion
            const booking = await tx.booking.findUnique({
              where: { id: bookingId },
              include: {
                court: { select: { name: true } },
                user: { select: { email: true, name: true, club: { select: { name: true, slug: true } } } },
              },
            })

            // Asegurar que existan BookingPayments (pueden faltar por fire-and-forget)
            await asegurarBookingPayments(tx, bookingId)

            // Marcar todos los BookingPayments como pagados
            await tx.bookingPayment.updateMany({
              where: { bookingId, status: "pending" },
              data: { status: "paid", paidAt: new Date() },
            })

            return booking
          })

          // Si booking estaba cancelada, emitir refund automatico
          if (!updatedBooking) {
            await enqueueBookingRefund(bookingId, "Pago recibido tras cancelar la reserva")
            logger.warn("STRIPE_WEBHOOK", "Pago recibido para reserva cancelada; reembolso encolado", { bookingId })
            break
          }

          logger.info("STRIPE_BOOKING_PAYMENT", "Pago de reserva confirmado", { bookingId, amount: (session.amount_total ?? 0) / 100 })

          // Completar los intentos antes de confirmar el webhook para que el
          // runtime no interrumpa trabajo pendiente.
          const communicationTasks: Promise<unknown>[] = []
          if (userId) {
            communicationTasks.push(crearNotificacion({
              tipo: "booking_confirmed",
              titulo: "Pago confirmado",
              mensaje: `Tu pago para la reserva en ${updatedBooking.court.name} ha sido confirmado.`,
              userId,
              clubId: paymentClubId,
              metadata: { bookingId },
              url: "/reservar",
            }))
          }

          if (updatedBooking.user?.email) {
            communicationTasks.push(enviarEmailConfirmacionReserva({
              email: updatedBooking.user.email,
              nombre: updatedBooking.user.name || "Jugador",
              pistaNombre: updatedBooking.court.name,
              fechaHoraInicio: updatedBooking.startTime,
              fechaHoraFin: updatedBooking.endTime,
              precioTotal: updatedBooking.totalPrice,
              estadoPago: "paid",
              clubNombre: updatedBooking.user.club?.name || "",
              clubSlug: updatedBooking.user.club?.slug || "",
            }))
          }
          await Promise.allSettled(communicationTasks)
        }

        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await sincronizarSuscripcion(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const club = await db.club.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        })
        if (!club) break

        await db.club.update({
          where: { id: club.id },
          data: {
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
          },
        })
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const club = await db.club.findFirst({
          where: { stripeCustomerId: customerId },
        })
        if (!club) break

        // Crear registro de pago
        await db.payment.upsert({
          where: { stripePaymentId: invoice.id },
          create: {
            amount: (invoice.amount_paid ?? 0) / 100, // Stripe usa centimos
            currency: invoice.currency?.toUpperCase() ?? "EUR",
            status: "succeeded",
            type: "subscription",
            stripePaymentId: invoice.id,
            clubId: club.id,
          },
          update: {},
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const club = await db.club.findFirst({
          where: { stripeCustomerId: customerId },
        })
        if (!club) break

        await db.club.update({
          where: { id: club.id },
          data: { subscriptionStatus: "past_due" },
        })
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string
        if (!paymentIntentId) break

        const payment = await db.payment.findFirst({
          where: { stripePaymentId: paymentIntentId, type: "booking" },
        })
        if (!payment || payment.status === "refunded") break

        // Sincronizar atomicamente: Payment + Booking.paymentStatus + BookingPayments
        await db.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: "refunded" },
          })
          if (payment.bookingId) {
            await aplicarRefundBooking(tx, payment.bookingId)
          }
          await tx.refundOperation.updateMany({
            where: { paymentId: payment.id, status: { not: "SUCCEEDED" } },
            data: {
              status: "SUCCEEDED",
              stripeRefundId: charge.refunds?.data[0]?.id,
              completedAt: new Date(),
              lockedAt: null,
              lastError: null,
            },
          })
        })

        logger.info("STRIPE_REFUND", "Reembolso de reserva procesado", { paymentId: payment.id, bookingId: payment.bookingId })
        break
      }

      case "customer.subscription.trial_will_end": {
        // Stripe envia este evento 3 dias antes de que expire el trial
        const subscription = event.data.object as Stripe.Subscription
        const club = await db.club.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        })
        if (!club) break

        // Notificar a todos los admins del club
        const admins = await db.clubMembership.findMany({
          where: {
            clubId: club.id,
            status: "ACTIVE",
            role: { in: ["SUPER_ADMIN", "CLUB_ADMIN"] },
            user: { isActive: true },
          },
          select: { userId: true },
        })

        for (const admin of admins) {
          await crearNotificacion({
            tipo: "subscription_trial_ending",
            titulo: "Tu prueba gratuita termina pronto",
            mensaje: "Quedan 3 dias de prueba gratuita. Elige un plan para seguir usando Padel Club OS sin interrupciones.",
            userId: admin.userId,
            clubId: club.id,
            url: "/dashboard/facturacion",
          })
        }
        break
      }
    }

    if (db.stripeWebhookEvent?.update) {
      await db.stripeWebhookEvent.update({
        where: { eventId: event.id },
        data: { status: "SUCCEEDED", processedAt: new Date(), lastError: null },
      })
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    if (claimed && db.stripeWebhookEvent?.updateMany) {
      try {
        await db.stripeWebhookEvent.updateMany({
          where: { eventId: event.id, status: "PROCESSING" },
          data: { status: "FAILED", lastError: webhookError(error) },
        })
      } catch {
        // El error original es el que debe gobernar el reintento de Stripe.
      }
    }
    logger.error("STRIPE_WEBHOOK_HANDLER", "Error procesando evento webhook", { ruta: "/api/stripe/webhook" }, error)
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    )
  }
}
