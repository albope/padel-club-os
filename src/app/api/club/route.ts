import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { canUseOnlinePayments, getSubscriptionInfo } from "@/lib/subscription";
import { logger } from "@/lib/logger";
import { registrarAuditoria } from "@/lib/audit";
import * as z from "zod";
import { esZonaHorariaValida } from "@/lib/timezone";

const urlOpcional = z.string().url("URL no valida.").max(2000).optional().or(z.literal("")).or(z.literal(null))

const ClubUpdateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido.").max(100, "El nombre no puede superar 100 caracteres.").optional(),
  openingTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Formato de hora invalido (HH:MM).").optional(),
  closingTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Formato de hora invalido (HH:MM).").optional(),
  description: z.string().max(1000, "La descripcion no puede superar 1000 caracteres.").optional().or(z.literal("")).or(z.literal(null)),
  phone: z.string().max(20, "El telefono no puede superar 20 caracteres.").optional().or(z.literal("")).or(z.literal(null)),
  email: z.string().email("Email no valido.").max(255).optional().or(z.literal("")).or(z.literal(null)),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color invalido (formato hex #RRGGBB).").optional(),
  logoUrl: urlOpcional,
  bannerUrl: urlOpcional,
  instagramUrl: urlOpcional,
  facebookUrl: urlOpcional,
  maxAdvanceBooking: z.number().int().min(1).max(90).optional().nullable(),
  cancellationHours: z.number().int().min(0).max(48).optional().nullable(),
  enableOpenMatches: z.boolean().optional(),
  enablePlayerBooking: z.boolean().optional(),
  bookingPaymentMode: z.enum(["online", "presential", "both"], { errorMap: () => ({ message: "Modo de pago no valido." }) }).optional(),
  bookingDuration: z.number().int().refine(v => [60, 90, 120].includes(v), "Duracion debe ser 60, 90 o 120 minutos.").optional().nullable(),
  timezone: z.string().max(80).refine(esZonaHorariaValida, "Zona horaria no valida.").optional(),
  registrationMode: z.enum(["OPEN", "APPROVAL", "INVITE_ONLY", "CLOSED"]).optional(),
  isPublished: z.boolean().optional(),
}).refine(
  (data) => !data.openingTime || !data.closingTime || data.openingTime < data.closingTime,
  { message: "La hora de cierre debe ser posterior a la de apertura.", path: ["closingTime"] },
)

// GET: Obtener datos del club
export async function GET() {
  try {
    const auth = await requireAuth("settings:read")
    if (isAuthError(auth)) return auth

    const club = await db.club.findUnique({
      where: { id: auth.session.user.clubId },
    });

    return NextResponse.json(club);
  } catch (error) {
    logger.error("CLUB_GET", "Error al obtener datos del club", { ruta: "/api/club" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH: Actualizar configuracion del club
export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth("settings:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(ClubUpdateSchema, body);
    if (!result.success) return result.response;
    const {
      name, openingTime, closingTime,
      description, phone, email, primaryColor,
      logoUrl, bannerUrl, instagramUrl, facebookUrl,
      maxAdvanceBooking, cancellationHours,
      enableOpenMatches, enablePlayerBooking,
      bookingPaymentMode, bookingDuration,
      timezone, registrationMode, isPublished,
    } = result.data;

    if (openingTime || closingTime) {
      const currentHours = await db.club.findUnique({
        where: { id: auth.session.user.clubId },
        select: { openingTime: true, closingTime: true },
      })
      const nextOpening = openingTime ?? currentHours?.openingTime ?? "09:00"
      const nextClosing = closingTime ?? currentHours?.closingTime ?? "23:00"
      if (nextOpening >= nextClosing) {
        return NextResponse.json(
          { error: "La hora de cierre debe ser posterior a la de apertura." },
          { status: 400 },
        )
      }
    }

    if (isPublished === true) {
      const [clubActual, pistas] = await Promise.all([
        db.club.findUnique({
          where: { id: auth.session.user.clubId },
          select: { name: true },
        }),
        db.court.findMany({
          where: { clubId: auth.session.user.clubId },
          select: {
            id: true,
            name: true,
            pricings: { select: { id: true }, take: 1 },
          },
        }),
      ])
      if (!clubActual?.name || pistas.length === 0) {
        return NextResponse.json(
          { error: "Antes de publicar, configura el nombre y al menos una pista." },
          { status: 409 },
        )
      }
      const sinTarifa = pistas.find((pista) => pista.pricings.length === 0)
      if (enablePlayerBooking !== false && sinTarifa) {
        return NextResponse.json(
          {
            error: `Configura al menos una tarifa para ${sinTarifa.name} antes de publicar reservas.`,
          },
          { status: 409 },
        )
      }
    }

    // Validar que el club puede usar pagos online antes de permitir el cambio
    if (bookingPaymentMode && bookingPaymentMode !== "presential") {
      const club = await db.club.findUnique({
        where: { id: auth.session.user.clubId },
        select: { stripeConnectOnboarded: true },
      })
      if (!club?.stripeConnectOnboarded) {
        return NextResponse.json(
          { error: "Debes conectar tu cuenta de Stripe antes de habilitar pagos online." },
          { status: 400 }
        )
      }

      const subInfo = await getSubscriptionInfo(auth.session.user.clubId)
      if (!canUseOnlinePayments(subInfo.tier)) {
        return NextResponse.json(
          { error: "Los pagos online estan disponibles en los planes Pro y Enterprise." },
          { status: 403 }
        )
      }
    }

    const updatedClub = await db.club.update({
      where: { id: auth.session.user.clubId },
      data: {
        name, openingTime, closingTime,
        description, phone, email, primaryColor,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
        instagramUrl: instagramUrl || null,
        facebookUrl: facebookUrl || null,
        maxAdvanceBooking, cancellationHours,
        enableOpenMatches, enablePlayerBooking,
        bookingPaymentMode, bookingDuration,
        timezone, registrationMode, isPublished,
        ...(isPublished === true ? { onboardingCompletedAt: new Date() } : {}),
      },
    });

    registrarAuditoria({
      recurso: "club",
      accion: "actualizar",
      entidadId: auth.session.user.clubId,
      detalles: { campos: Object.keys(result.data) },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return NextResponse.json(updatedClub);
  } catch (error) {
    logger.error("CLUB_SETTINGS_UPDATE", "Error al actualizar configuracion del club", { ruta: "/api/club" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
