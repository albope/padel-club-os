import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";

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
    console.error("[GET_COURTS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Crear una nueva pista
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("courts:create")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { name, type } = body;

    if (!name || !type) {
      return new NextResponse("Faltan nombre o tipo de pista", { status: 400 });
    }

    const court = await db.court.create({
      data: {
        name,
        type,
        clubId: auth.session.user.clubId,
      },
    });

    return NextResponse.json(court, { status: 201 });
  } catch (error) {
    console.error("[CREATE_COURT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
