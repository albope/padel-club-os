import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { logger } from "@/lib/logger";
import { registrarAuditoria } from "@/lib/audit";
import { NextResponse } from "next/server";
import { canCreateCourt } from "@/lib/subscription";
import { validarBody } from "@/lib/validation";
import * as z from "zod";

const CourtCreateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido.").max(100, "El nombre no puede superar 100 caracteres."),
  type: z.string().min(1, "El tipo es requerido.").max(50, "El tipo no puede superar 50 caracteres."),
})

// GET: Obtener todas las pistas del club
export async function GET() {
  try {
    const auth = await requireAuth("courts:read")
    if (isAuthError(auth)) return auth

    const courts = await db.court.findMany({
      where: { clubId: auth.session.user.clubId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(courts);
  } catch (error) {
    logger.error("COURTS_GET", "Error al listar pistas del club", { ruta: "/api/courts" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Crear una nueva pista
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("courts:create", { requireSubscription: true })
    if (isAuthError(auth)) return auth

    // Verificar limite de pistas del plan
    const check = await canCreateCourt(auth.session.user.clubId)
    if (!check.allowed) {
      return NextResponse.json(
        { error: check.reason, code: "PLAN_LIMIT_REACHED" },
        { status: 403 }
      )
    }

    const body = await req.json();
    const result = validarBody(CourtCreateSchema, body);
    if (!result.success) return result.response;
    const { name, type } = result.data;

    const court = await db.court.create({
      data: {
        name,
        type,
        clubId: auth.session.user.clubId,
      },
    });

    registrarAuditoria({
      recurso: "court",
      accion: "crear",
      entidadId: court.id,
      detalles: { nombre: court.name, tipo: court.type },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return NextResponse.json(court, { status: 201 });
  } catch (error) {
    logger.error("COURT_CREATE", "Error al crear pista", { ruta: "/api/courts" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
