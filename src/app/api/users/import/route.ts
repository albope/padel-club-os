import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { validarBody } from "@/lib/validation";
import * as z from "zod";

const SocioImportSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  email: z.string().email("Email no valido.").max(255),
  password: z.string().min(8).max(128).optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  position: z.string().max(50).optional().or(z.literal("")),
  level: z.string().max(10).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")).or(z.literal(null)),
})

const ImportSociosSchema = z.object({
  socios: z.array(SocioImportSchema).min(1, "Se requiere al menos un socio.").max(500, "Maximo 500 socios por importacion."),
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
    const { socios } = result.data;

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

      const hashedPassword = await hash(socio.password || 'padel123', 10);

      sociosToCreate.push({
        name: socio.name,
        email: socio.email,
        password: hashedPassword,
        phone: socio.phone || null,
        position: socio.position || null,
        level: socio.level || null,
        birthDate: socio.birthDate ? new Date(socio.birthDate) : null,
        clubId,
      });
      existingEmails.add(socio.email);
    }

    if (sociosToCreate.length > 0) {
      const result = await db.user.createMany({
        data: sociosToCreate,
        skipDuplicates: true,
      });
      successCount = result.count;
    }

    return NextResponse.json({ successCount, errors });
  } catch (error) {
    console.error("[IMPORT_USERS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
