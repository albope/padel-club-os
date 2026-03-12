import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { calcularPrecioReserva } from "@/lib/pricing";
import { validarBody } from "@/lib/validation";
import { limpiarWaitlistAlReservar } from "@/lib/waitlist";
import { verificarBloqueo } from "@/lib/court-blocks";
import { registrarAuditoria } from "@/lib/audit";
import * as z from "zod";

const BookingCreateSchema = z.object({
  courtId: z.string().min(1, "El ID de pista es requerido."),
  startTime: z.string().min(1, "La hora de inicio es requerida."),
  endTime: z.string().min(1, "La hora de fin es requerida."),
  userId: z.string().optional(),
  guestName: z.string().max(100, "El nombre del invitado no puede superar 100 caracteres.").optional(),
  numPlayers: z.number().int().min(2).max(4).optional(),
}).refine(
  (data) => data.userId || data.guestName,
  { message: "Se requiere un socio o nombre de invitado.", path: ["userId"] }
)

// GET: Obtener todas las reservas del club
export async function GET() {
  try {
    const auth = await requireAuth("bookings:read")
    if (isAuthError(auth)) return auth

    const bookings = await db.booking.findMany({
      where: { clubId: auth.session.user.clubId },
      include: {
        user: { select: { name: true } },
        court: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    logger.error("BOOKINGS_GET", "Error al listar reservas del club", { ruta: "/api/bookings" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Crear una nueva reserva con deteccion de solapamiento
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("bookings:create", { requireSubscription: true })
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(BookingCreateSchema, body);
    if (!result.success) return result.response;
    const { courtId, userId, guestName, startTime, endTime, numPlayers } = result.data;

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    // Validar que la pista pertenece al club del admin
    const court = await db.court.findFirst({
      where: { id: courtId, clubId: auth.session.user.clubId },
    });
    if (!court) {
      return new NextResponse("Pista no encontrada en este club.", { status: 404 });
    }

    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId,
        clubId: auth.session.user.clubId,
        status: { not: "cancelled" },
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    });

    if (overlappingBooking) {
      return new NextResponse("Este horario ya está ocupado en la pista seleccionada.", { status: 409 });
    }

    // Verificar bloqueo de pista
    const bloqueo = await verificarBloqueo(auth.session.user.clubId, courtId, newStartTime, newEndTime);
    if (bloqueo) {
      return NextResponse.json(
        { error: `La pista esta bloqueada en ese horario (${bloqueo.reason}${bloqueo.note ? `: ${bloqueo.note}` : ""}).` },
        { status: 409 }
      );
    }

    const totalPrice = await calcularPrecioReserva(courtId, auth.session.user.clubId, newStartTime, newEndTime);

    const efectivoNumPlayers = numPlayers || 4

    const newBooking = await db.booking.create({
      data: {
        courtId,
        userId: userId || null,
        guestName: guestName || null,
        startTime: newStartTime,
        endTime: newEndTime,
        totalPrice,
        numPlayers: efectivoNumPlayers,
        paymentStatus: "exempt",
        paymentMethod: "exempt", // Reservas admin no requieren pago
        status: "confirmed",
        clubId: auth.session.user.clubId,
      },
    });

    // Limpiar lista de espera del slot
    limpiarWaitlistAlReservar({ courtId, startTime: newStartTime, userId: userId || undefined }).catch(() => {})

    registrarAuditoria({
      recurso: "booking",
      accion: "crear",
      entidadId: newBooking.id,
      detalles: { pistaId: courtId, fecha: startTime, usuario: userId || guestName },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    logger.error("BOOKING_CREATE", "Error al crear reserva", { ruta: "/api/bookings" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
