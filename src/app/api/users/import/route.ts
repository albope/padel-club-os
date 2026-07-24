import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { validarBody } from "@/lib/validation";
import { crearTokenRecuperacion } from "@/lib/tokens";
import { enviarEmailActivacionCuenta } from "@/lib/email";
import { logger } from "@/lib/logger";
import { registrarAuditoria } from "@/lib/audit";
import * as z from "zod";
import { normalizarEmail } from "@/lib/identity";
import { getPlanLimits, getSubscriptionInfo } from "@/lib/subscription";

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
    const auth = await requireAuth("users:import", { requireSubscription: true })
    if (isAuthError(auth)) return auth
    const clubId = auth.session.user.clubId;

    const body = await req.json();
    const result = validarBody(ImportSociosSchema, body);
    if (!result.success) return result.response;
    const { socios, enviarActivacion } = result.data;

    let successCount = 0;
    const errors: string[] = [];
    const emailsEnArchivo = new Set<string>();
    const sociosNormalizados: Array<z.infer<typeof SocioImportSchema>> = [];

    for (const socio of socios) {
      if (!socio.name || !socio.email) {
        errors.push(`Entrada omitida: Faltan nombre o email.`);
        continue;
      }
      const email = normalizarEmail(socio.email);
      if (emailsEnArchivo.has(email)) {
        errors.push(`Email duplicado en el archivo: ${email}.`);
        continue;
      }
      emailsEnArchivo.add(email);
      sociosNormalizados.push({ ...socio, email });
    }

    const usuariosExistentes = await db.user.findMany({
      where: { email: { in: sociosNormalizados.map((socio) => socio.email) } },
      include: {
        memberships: {
          where: { clubId },
          select: { id: true },
        },
      },
    });
    const usuariosPorEmail = new Map(
      usuariosExistentes
        .filter((usuario) => usuario.email)
        .map((usuario) => [normalizarEmail(usuario.email!), usuario]),
    );

    const infoPlan = await getSubscriptionInfo(clubId);
    const limiteSocios = getPlanLimits(infoPlan.tier).members;
    const sociosActuales = await db.clubMembership.count({
      where: {
        clubId,
        role: "PLAYER",
        status: { in: ["ACTIVE", "PENDING"] },
      },
    });
    let plazasDisponibles = limiteSocios === -1
      ? Number.POSITIVE_INFINITY
      : Math.max(0, limiteSocios - sociosActuales);

    const sociosAceptados: Array<{
      socio: z.infer<typeof SocioImportSchema>
      existente: (typeof usuariosExistentes)[number] | undefined
    }> = [];
    for (const socio of sociosNormalizados) {
      const existente = usuariosPorEmail.get(socio.email);
      if (existente?.memberships.length) {
        errors.push(`Email omitido: ${socio.email} ya pertenece al club.`);
        continue;
      }
      if (plazasDisponibles <= 0) {
        errors.push(`Límite del plan alcanzado: ${socio.email} no se importó.`);
        continue;
      }
      sociosAceptados.push({ socio, existente });
      plazasDisponibles--;
    }

    if (sociosAceptados.length > 0) {
      await db.$transaction(async (tx) => {
        for (const { socio, existente } of sociosAceptados) {
          const usuario = existente ?? await tx.user.create({
            data: {
              name: socio.name,
              email: socio.email,
              password: null,
              mustResetPassword: true,
              phone: socio.phone || null,
              position: socio.position || null,
              level: socio.level || null,
              birthDate: socio.birthDate ? new Date(socio.birthDate) : null,
              clubId,
              role: "PLAYER",
            },
          });

          await tx.clubMembership.create({
            data: {
              userId: usuario.id,
              clubId,
              role: "PLAYER",
              status: "ACTIVE",
              approvedAt: new Date(),
              approvedById: auth.session.user.id,
            },
          });
        }
      });
      successCount = sociosAceptados.length;
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
      const emailsCreados = sociosAceptados.map(({ socio }) => socio.email);
      const usuariosCreados = await db.user.findMany({
        where: {
          email: { in: emailsCreados },
          mustResetPassword: true,
          memberships: { some: { clubId, status: "ACTIVE" } },
        },
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
