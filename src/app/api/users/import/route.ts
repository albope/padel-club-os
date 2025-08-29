// Path: src/app/api/users/import/route.ts
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const clubId = session.user.clubId;

    const body = await req.json();
    const { socios } = body;

    if (!Array.isArray(socios) || socios.length === 0) {
      return new NextResponse("Se requiere una lista de socios.", { status: 400 });
    }

    let successCount = 0;
    const errors: string[] = [];
    const existingEmails = new Set((await db.user.findMany({ select: { email: true } })).map(u => u.email).filter(Boolean));

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
        clubId: clubId,
      });
      // Añadimos el email al set para evitar duplicados dentro del mismo archivo
      existingEmails.add(socio.email);
    }
    
    if (sociosToCreate.length > 0) {
        const result = await db.user.createMany({
            data: sociosToCreate,
            skipDuplicates: true, // Por si acaso, aunque ya filtramos
        });
        successCount = result.count;
    }

    return NextResponse.json({ successCount, errors });

  } catch (error) {
    console.error("[IMPORT_USERS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}