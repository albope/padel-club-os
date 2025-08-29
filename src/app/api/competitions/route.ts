// Path: src/app/api/competitions/route.ts
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { CompetitionFormat } from "@prisma/client";

// GET: Obtener todas las competiciones
export async function GET() {
  // ... (código sin cambios)
}

// POST: Crear una nueva competición
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    
    // --- PASO 1 DE DEPURACIÓN: Ver los datos exactos que llegan del formulario ---
    console.log("------ [DEBUG] BODY RECIBIDO DEL FORMULARIO ------");
    console.log(body);
    console.log("--------------------------------------------------");

    const { name, format, rounds, groupSize, teamsPerGroupToAdvance } = body;

    if (!name || !format) {
      return new NextResponse("El nombre y el formato son requeridos", { status: 400 });
    }
    
    if (!Object.values(CompetitionFormat).includes(format)) {
        return new NextResponse("Formato de competición no válido", { status: 400 });
    }

    // Preparamos el objeto de datos que se va a guardar
    const dataToCreate = {
      name,
      format,
      rounds: (format === CompetitionFormat.LEAGUE || format === CompetitionFormat.GROUP_AND_KNOCKOUT) ? Number(rounds) : 1,
      groupSize: groupSize ? Number(groupSize) : null,
      teamsPerGroupToAdvance: teamsPerGroupToAdvance ? Number(teamsPerGroupToAdvance) : null,
      clubId: session.user.clubId,
    };

    // --- PASO 2 DE DEPURACIÓN: Ver el objeto final antes de enviarlo a Prisma ---
    console.log("------ [DEBUG] DATOS A CREAR EN PRISMA ------");
    console.log(dataToCreate);
    console.log("-------------------------------------------");

    const competition = await db.competition.create({
      data: dataToCreate,
    });

    return NextResponse.json(competition, { status: 201 });
  } catch (error) {
    // --- PASO 3 DE DEPURACIÓN: Capturar y mostrar el error completo de Prisma ---
    console.error("====== ERROR DETALLADO EN /api/competitions ======");
    console.error(error);
    console.error("================================================");
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}