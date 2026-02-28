import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { calcularPrecioReserva } from "@/lib/pricing";
import { validarBody } from "@/lib/validation";
import * as z from "zod";

const BookingCreateSchema = z.object({
  courtId: z.string().min(1, "El ID de pista es requerido."),
  startTime: z.string().min(1, "La hora de inicio es requerida."),
  endTime: z.string().min(1, "La hora de fin es requerida."),
  userId: z.string().optional(),
  guestName: z.string().max(100, "El nombre del invitado no puede superar 100 caracteres.").optional(),
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
    console.error("[GET_BOOKINGS_ERROR]", error);
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
    const { courtId, userId, guestName, startTime, endTime } = result.data;

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    const overlappingBooking = await db.booking.findFirst({
      where: {
        courtId,
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    });

    if (overlappingBooking) {
      return new NextResponse("Este horario ya está ocupado en la pista seleccionada.", { status: 409 });
    }

    const totalPrice = await calcularPrecioReserva(courtId, auth.session.user.clubId, newStartTime, newEndTime);

    const newBooking = await db.booking.create({
      data: {
        courtId,
        userId: userId || null,
        guestName: guestName || null,
        startTime: newStartTime,
        endTime: newEndTime,
        totalPrice,
        paymentStatus: "exempt", // Reservas admin no requieren pago online
        status: "confirmed",
        clubId: auth.session.user.clubId,
      },
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("[CREATE_BOOKING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
