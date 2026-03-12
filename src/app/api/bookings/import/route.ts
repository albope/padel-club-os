import { db } from "@/lib/db"
import { requireAuth, isAuthError } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { validarBody } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { calcularPrecioReserva } from "@/lib/pricing"
import { registrarAuditoria } from "@/lib/audit"
import { normalizarNombre, type ImportError } from "@/lib/import-courts"
import {
  parsearFecha,
  parsearHora,
  construirDatetime,
  dedupReservasCSV,
  mapearEstadoPago,
  esEstadoPagoValido,
  type ReservaImportada,
} from "@/lib/import-bookings"
import * as z from "zod"

const ReservaImportSchema = z.object({
  pista: z.string().min(1, "El nombre de pista es requerido.").max(100),
  fecha: z.string().min(1, "La fecha es requerida."),
  horaInicio: z.string().min(1, "La hora de inicio es requerida."),
  horaFin: z.string().min(1, "La hora de fin es requerida."),
  email: z.string().email().max(255).optional().or(z.literal("")),
  nombreInvitado: z.string().max(100).optional().or(z.literal("")),
  estadoPago: z.string().max(20).optional().or(z.literal("")),
  numJugadores: z.number().int().min(2).max(4).optional(),
  precio: z.number().positive().optional(),
  fila: z.number().int().min(1),
})

const ImportReservasBodySchema = z.object({
  reservas: z.array(ReservaImportSchema)
    .min(1, "Se requiere al menos una reserva.")
    .max(500, "Maximo 500 reservas por importacion."),
})

// POST: Importar reservas futuras en bulk
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("bookings:import", { requireSubscription: true })
    if (isAuthError(auth)) return auth
    const clubId = auth.session.user.clubId!

    const body = await req.json()
    const result = validarBody(ImportReservasBodySchema, body)
    if (!result.success) return result.response
    const { reservas } = result.data

    // 1. Dedup intra-CSV
    const { unicas: reservasUnicas, errors: errorsDedup } = dedupReservasCSV(reservas as ReservaImportada[])
    const errors: ImportError[] = [...errorsDedup]
    const warnings: string[] = []

    if (reservasUnicas.length === 0) {
      return NextResponse.json({ successCount: 0, errors, warnings })
    }

    // 2. Resolver pistas del club → Map<nombreNormalizado, { id, name }>
    const pistasDB = await db.court.findMany({
      where: { clubId },
      select: { id: true, name: true },
    })
    const pistaMap = new Map(pistasDB.map(p => [normalizarNombre(p.name), p]))

    // 3. Resolver usuarios del club → Map<email, { id, name }>
    const usuariosDB = await db.user.findMany({
      where: { clubId },
      select: { id: true, email: true, name: true },
    })
    const userMap = new Map(usuariosDB.filter(u => u.email).map(u => [u.email!.toLowerCase(), u]))

    // 4. Validar y transformar cada reserva
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    interface ReservaParaCrear {
      courtId: string
      userId: string | null
      guestName: string | null
      startTime: Date
      endTime: Date
      totalPrice: number
      paymentStatus: string
      numPlayers: number
      fila: number
    }

    const reservasValidas: ReservaParaCrear[] = []

    for (const reserva of reservasUnicas) {
      const fila = reserva.fila

      // Parsear fecha
      const fecha = parsearFecha(reserva.fecha)
      if (!fecha) {
        errors.push({ fila, campo: "fecha", mensaje: `Fecha invalida: "${reserva.fecha}". Use DD/MM/YYYY o YYYY-MM-DD.` })
        continue
      }

      // Validar fecha futura
      if (fecha < now) {
        errors.push({ fila, campo: "fecha", mensaje: `La fecha ${reserva.fecha} es pasada. Solo se pueden importar reservas futuras.` })
        continue
      }

      // Parsear horas
      const horaInicio = parsearHora(reserva.horaInicio)
      if (!horaInicio) {
        errors.push({ fila, campo: "horaInicio", mensaje: `Hora de inicio invalida: "${reserva.horaInicio}". Use HH:MM.` })
        continue
      }

      const horaFin = parsearHora(reserva.horaFin)
      if (!horaFin) {
        errors.push({ fila, campo: "horaFin", mensaje: `Hora de fin invalida: "${reserva.horaFin}". Use HH:MM.` })
        continue
      }

      // Validar horaInicio < horaFin
      const startMinutes = horaInicio.hour * 60 + horaInicio.minute
      const endMinutes = horaFin.hour * 60 + horaFin.minute
      if (startMinutes >= endMinutes) {
        errors.push({ fila, campo: "horaFin", mensaje: `La hora de fin (${reserva.horaFin}) debe ser posterior a la hora de inicio (${reserva.horaInicio}).` })
        continue
      }

      // Resolver pista
      const pistaKey = normalizarNombre(reserva.pista)
      const pista = pistaMap.get(pistaKey)
      if (!pista) {
        errors.push({ fila, campo: "pista", mensaje: `Pista "${reserva.pista}" no encontrada en el club. Importela primero.` })
        continue
      }

      // Resolver usuario o invitado
      let userId: string | null = null
      let guestName: string | null = null
      const email = reserva.email?.trim() || ""
      const nombreInv = reserva.nombreInvitado?.trim() || ""

      if (email) {
        const user = userMap.get(email.toLowerCase())
        if (user) {
          userId = user.id
        } else {
          // Email no encontrado: usar como invitado con warning
          guestName = nombreInv || email
          warnings.push(`Fila ${fila}: email "${email}" no encontrado en el club. Se usa como invitado.`)
        }
      } else if (nombreInv) {
        guestName = nombreInv
      } else {
        errors.push({ fila, campo: "email", mensaje: "Se requiere email o nombreInvitado." })
        continue
      }

      // Validar estado de pago
      const estadoPagoRaw = reserva.estadoPago?.trim() || ""
      if (estadoPagoRaw && !esEstadoPagoValido(estadoPagoRaw)) {
        errors.push({ fila, campo: "estadoPago", mensaje: `Estado de pago invalido: "${estadoPagoRaw}". Use pendiente, pagado o exento.` })
        continue
      }
      const paymentStatus = mapearEstadoPago(reserva.estadoPago)

      const numPlayers = reserva.numJugadores || 4
      const startTime = construirDatetime(fecha, horaInicio)
      const endTime = construirDatetime(fecha, horaFin)

      reservasValidas.push({
        courtId: pista.id,
        userId,
        guestName,
        startTime,
        endTime,
        totalPrice: reserva.precio ?? -1, // -1 = calcular automaticamente
        paymentStatus,
        numPlayers,
        fila,
      })
    }

    if (reservasValidas.length === 0) {
      return NextResponse.json({ successCount: 0, errors, warnings })
    }

    // 5. Deteccion de solapamiento bulk
    const allStartTimes = reservasValidas.map(r => r.startTime)
    const allEndTimes = reservasValidas.map(r => r.endTime)
    const minDate = new Date(Math.min(...allStartTimes.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allEndTimes.map(d => d.getTime())))

    const reservasExistentes = await db.booking.findMany({
      where: {
        clubId,
        status: { not: "cancelled" },
        startTime: { lte: maxDate },
        endTime: { gte: minDate },
      },
      select: { courtId: true, startTime: true, endTime: true },
    })

    // Prefetch bloqueos activos en el rango para check en memoria
    const bloqueos = await db.courtBlock.findMany({
      where: {
        clubId,
        startTime: { lt: maxDate },
        endTime: { gt: minDate },
      },
      select: { courtId: true, startTime: true, endTime: true, reason: true },
    })

    // Index existentes por courtId para busqueda rapida
    const existentesPorPista = new Map<string, { start: number; end: number }[]>()
    for (const r of reservasExistentes) {
      const arr = existentesPorPista.get(r.courtId) || []
      arr.push({ start: r.startTime.getTime(), end: r.endTime.getTime() })
      existentesPorPista.set(r.courtId, arr)
    }

    // Filtrar reservas con solapamiento
    const reservasSinSolapamiento: typeof reservasValidas = []
    // Tambien detectar solapamiento intra-CSV
    const intraCsvPorPista = new Map<string, { start: number; end: number; fila: number }[]>()

    for (const reserva of reservasValidas) {
      const startMs = reserva.startTime.getTime()
      const endMs = reserva.endTime.getTime()

      // Check solapamiento con reservas existentes en DB
      const existentes = existentesPorPista.get(reserva.courtId) || []
      const solapaDB = existentes.some(e => startMs < e.end && endMs > e.start)
      if (solapaDB) {
        errors.push({
          fila: reserva.fila,
          campo: "horaInicio",
          mensaje: `Solapamiento: ya existe una reserva en esa pista a esa hora.`,
        })
        continue
      }

      // Check solapamiento intra-CSV
      const csvExistentes = intraCsvPorPista.get(reserva.courtId) || []
      const solapaCSV = csvExistentes.some(e => startMs < e.end && endMs > e.start)
      if (solapaCSV) {
        errors.push({
          fila: reserva.fila,
          campo: "horaInicio",
          mensaje: `Solapamiento con otra reserva del mismo CSV.`,
        })
        continue
      }

      // Check bloqueo de pista (club-wide courtId=null o especifico)
      const bloqueada = bloqueos.some(b =>
        (b.courtId === null || b.courtId === reserva.courtId) &&
        startMs < b.endTime.getTime() && endMs > b.startTime.getTime()
      )
      if (bloqueada) {
        errors.push({
          fila: reserva.fila,
          campo: "horaInicio",
          mensaje: `La pista esta bloqueada en ese horario.`,
        })
        continue
      }

      // Registrar para deteccion intra-CSV
      csvExistentes.push({ start: startMs, end: endMs, fila: reserva.fila })
      intraCsvPorPista.set(reserva.courtId, csvExistentes)

      reservasSinSolapamiento.push(reserva)
    }

    if (reservasSinSolapamiento.length === 0) {
      return NextResponse.json({ successCount: 0, errors, warnings })
    }

    // 6. Calcular precios automaticos para las que no tienen override
    for (const reserva of reservasSinSolapamiento) {
      if (reserva.totalPrice === -1) {
        reserva.totalPrice = await calcularPrecioReserva(
          reserva.courtId,
          clubId,
          reserva.startTime,
          reserva.endTime,
        )
      }
    }

    // 7. Transaccion: crear reservas + BookingPayments
    const creadas = await db.$transaction(async (tx) => {
      const resultado: { courtName: string; startTime: Date; fila: number }[] = []

      for (const reserva of reservasSinSolapamiento) {
        const booking = await tx.booking.create({
          data: {
            startTime: reserva.startTime,
            endTime: reserva.endTime,
            totalPrice: reserva.totalPrice,
            courtId: reserva.courtId,
            userId: reserva.userId,
            guestName: reserva.guestName,
            clubId,
            status: "confirmed",
            paymentStatus: reserva.paymentStatus,
            paymentMethod: reserva.paymentStatus === "exempt" ? "exempt" : "presential",
            numPlayers: reserva.numPlayers,
          },
        })

        // Crear BookingPayments
        const precioPorJugador = reserva.totalPrice > 0
          ? Math.round((reserva.totalPrice / reserva.numPlayers) * 100) / 100
          : 0

        if (precioPorJugador > 0) {
          const pagos = []
          if (reserva.userId) {
            pagos.push({
              bookingId: booking.id,
              userId: reserva.userId,
              amount: precioPorJugador,
              status: reserva.paymentStatus === "paid" ? "paid" : "pending",
              paidAt: reserva.paymentStatus === "paid" ? new Date() : null,
              clubId,
            })
          }
          // Resto de jugadores como invitados
          const jugadoresRestantes = reserva.numPlayers - (reserva.userId ? 1 : 0)
          for (let i = 0; i < jugadoresRestantes; i++) {
            pagos.push({
              bookingId: booking.id,
              guestName: i === 0 && reserva.guestName ? reserva.guestName : `Jugador ${i + (reserva.userId ? 2 : 1)}`,
              amount: precioPorJugador,
              status: reserva.paymentStatus === "paid" ? "paid" : "pending",
              paidAt: reserva.paymentStatus === "paid" ? new Date() : null,
              clubId,
            })
          }

          await tx.bookingPayment.createMany({ data: pagos })
        }

        const pistaObj = pistaMap.get(normalizarNombre(
          pistasDB.find(p => p.id === reserva.courtId)?.name || ""
        ))
        resultado.push({
          courtName: pistaObj?.name || "",
          startTime: reserva.startTime,
          fila: reserva.fila,
        })
      }

      return resultado
    })

    registrarAuditoria({
      recurso: "booking",
      accion: "importar",
      detalles: { creados: creadas.length, errores: errors.length, warnings: warnings.length },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    logger.info("IMPORT_BOOKINGS", `${creadas.length} reservas importadas`, {
      clubId,
      importadas: creadas.length,
      errores: errors.length,
      warnings: warnings.length,
    })

    return NextResponse.json({
      successCount: creadas.length,
      errors,
      warnings,
    })
  } catch (error: unknown) {
    logger.error("IMPORT_BOOKINGS", "Error en importacion de reservas", { ruta: "/api/bookings/import" }, error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
