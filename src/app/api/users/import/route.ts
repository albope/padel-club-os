import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";

// POST: Importar socios en bulk
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("users:import")
    if (isAuthError(auth)) return auth
    const clubId = auth.session.user.clubId;

    const body = await req.json();
    const { socios } = body;

    if (!Array.isArray(socios) || socios.length === 0) {
      return new NextResponse("Se requiere una lista de socios.", { status: 400 });
    }

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
