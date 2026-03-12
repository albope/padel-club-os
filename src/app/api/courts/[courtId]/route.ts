import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { logger } from "@/lib/logger";
import { registrarAuditoria } from "@/lib/audit";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import * as z from "zod";

const CourtUpdateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido.").max(100, "El nombre no puede superar 100 caracteres.").optional(),
  type: z.string().min(1).max(50, "El tipo no puede superar 50 caracteres.").optional(),
})

// PATCH: Actualizar una pista
export async function PATCH(
  req: Request,
  { params }: { params: { courtId: string } }
) {
  try {
    const auth = await requireAuth("courts:update")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(CourtUpdateSchema, body);
    if (!result.success) return result.response;
    const { name, type } = result.data;

    if (!params.courtId) {
      return new NextResponse("ID de pista requerido", { status: 400 });
    }

    const updatedCourt = await db.court.update({
      where: { id: params.courtId, clubId: auth.session.user.clubId },
      data: { name, type },
    });

    registrarAuditoria({
      recurso: "court",
      accion: "actualizar",
      entidadId: params.courtId,
      detalles: { campos: Object.keys(result.data) },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return NextResponse.json(updatedCourt);
  } catch (error) {
    logger.error("COURT_UPDATE", "Error al actualizar pista", { ruta: "/api/courts/[courtId]" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Eliminar una pista
export async function DELETE(
  req: Request,
  { params }: { params: { courtId: string } }
) {
  try {
    const auth = await requireAuth("courts:delete")
    if (isAuthError(auth)) return auth

    if (!params.courtId) {
      return new NextResponse("ID de pista requerido", { status: 400 });
    }

    const deletedCourt = await db.court.delete({
      where: { id: params.courtId, clubId: auth.session.user.clubId },
    });

    registrarAuditoria({
      recurso: "court",
      accion: "eliminar",
      entidadId: params.courtId,
      detalles: { nombre: deletedCourt.name },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("COURT_DELETE", "Error al eliminar pista", { ruta: "/api/courts/[courtId]" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
