import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { canUseOnlinePayments, getSubscriptionInfo } from "@/lib/subscription";
import { logger } from "@/lib/logger";
import * as z from "zod";

const urlOpcional = z.string().url("URL no valida.").max(2000).optional().or(z.literal("")).or(z.literal(null))

const ClubUpdateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido.").max(100, "El nombre no puede superar 100 caracteres.").optional(),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora invalido (HH:MM).").optional(),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora invalido (HH:MM).").optional(),
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
})

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
    } = result.data;

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
      },
    });

    return NextResponse.json(updatedClub);
  } catch (error) {
    logger.error("CLUB_SETTINGS_UPDATE", "Error al actualizar configuracion del club", { ruta: "/api/club" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
