import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { crearTokenRecuperacion } from "@/lib/tokens";
import { enviarEmailActivacionCuenta } from "@/lib/email";
import { logger } from "@/lib/logger";
import { registrarAuditoria } from "@/lib/audit";
import * as z from "zod";

const SocioImportSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  email: z.string().email("Email no valido.").max(255),
  phone: z.string().max(20).optional().or(z.literal("")),
  position: z.string().max(50).optional().or(z.literal("")),
  level: z.string().max(10).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")).or(z.literal(null)),
})

const ImportSociosSchema = z.object({
  socios: z.array(SocioImportSchema).min(1, "Se requiere al menos un socio.").max(500, "Maximo 500 socios por importacion."),
  enviarActivacion: z.boolean().default(true),
})

// POST: Importar socios en bulk
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("users:import")
    if (isAuthError(auth)) return auth
    const clubId = auth.session.user.clubId;

    const body = await req.json();
    const result = validarBody(ImportSociosSchema, body);
    if (!result.success) return result.response;
    const { socios, enviarActivacion } = result.data;

    let successCount = 0;
    const errors: string[] = [];
    const existingEmails = new Set(
      (await db.user.findMany({ select: { email: true } })).map(u => u.email).filter(Boolean)
    );

    const sociosToCreate = [];

    for (const socio of socios) {
      if (!socio.name || !socio.email) {
        errors.push(`Entrada omitida: Faltan nombre o email.`);
        continue;
      }
      if (existingEmails.has(socio.email)) {
        errors.push(`Email duplicado: ${socio.email} ya existe y fue omitido.`);
        continue;
      }

      sociosToCreate.push({
        name: socio.name,
        email: socio.email,
        password: null,
        mustResetPassword: true,
        phone: socio.phone || null,
        position: socio.position || null,
        level: socio.level || null,
        birthDate: socio.birthDate ? new Date(socio.birthDate) : null,
        clubId,
      });
      existingEmails.add(socio.email);
    }

    if (sociosToCreate.length > 0) {
      const createResult = await db.user.createMany({
        data: sociosToCreate,
        skipDuplicates: true,
      });
      successCount = createResult.count;
    }

    // Enviar emails de activacion si se solicita
    let emailsSent = 0;
    let emailsFailed = 0;

    if (enviarActivacion && successCount > 0) {
      // Obtener datos del club para el email
      const club = await db.club.findUnique({
        where: { id: clubId! },
        select: { name: true, slug: true },
      });

      if (!club?.slug || !club?.name) {
        logger.error("IMPORT_USERS", "Club sin slug o nombre, no se pueden enviar emails de activacion", { clubId })
        return NextResponse.json({
          successCount,
          errors,
          emailsSent: 0,
          emailsFailed: successCount,
          emailError: "El club no tiene slug o nombre configurado. Los socios fueron creados pero no se enviaron emails de activacion.",
        });
      }

      // Reconsultar usuarios creados por email (createMany no devuelve IDs)
      const emailsCreados = sociosToCreate.map(s => s.email).filter(Boolean) as string[];
      const usuariosCreados = await db.user.findMany({
        where: { email: { in: emailsCreados }, clubId },
        select: { email: true, name: true },
      });

      // Enviar en lotes de 10 con Promise.allSettled
      for (let i = 0; i < usuariosCreados.length; i += 10) {
        const lote = usuariosCreados.slice(i, i + 10);
        const resultados = await Promise.allSettled(
          lote.map(async (u) => {
            const token = await crearTokenRecuperacion(u.email!);
            await enviarEmailActivacionCuenta({
              email: u.email!,
              token,
              nombre: u.name,
              clubNombre: club.name,
              clubSlug: club.slug,
            });
          })
        );
        emailsSent += resultados.filter(r => r.status === "fulfilled").length;
        emailsFailed += resultados.filter(r => r.status === "rejected").length;
      }

      if (emailsFailed > 0) {
        logger.error("IMPORT_USERS", `${emailsFailed} emails de activacion fallaron`, { clubId, emailsFailed })
      }
    }

    registrarAuditoria({
      recurso: "user",
      accion: "importar",
      detalles: { creados: successCount, emailsEnviados: emailsSent, emailsFallidos: emailsFailed },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return NextResponse.json({ successCount, errors, emailsSent, emailsFailed });
  } catch (error) {
    logger.error("IMPORT_USERS", "Error en importacion de socios", { ruta: "/api/users/import" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
