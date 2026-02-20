import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { CompetitionFormat } from "@prisma/client";

// GET: Obtener todas las competiciones del club
export async function GET() {
  try {
    const auth = await requireAuth("competitions:read")
    if (isAuthError(auth)) return auth

    const competitions = await db.competition.findMany({
      where: { clubId: auth.session.user.clubId },
      include: {
        teams: { include: { player1: { select: { name: true } }, player2: { select: { name: true } } } },
        matches: true,
      },
    });

    return NextResponse.json(competitions);
  } catch (error) {
    console.error("[GET_COMPETITIONS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Crear una nueva competicion
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("competitions:create")
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const { name, format, rounds, groupSize, teamsPerGroupToAdvance } = body;

    if (!name || !format) {
      return new NextResponse("El nombre y el formato son requeridos", { status: 400 });
    }

    if (!Object.values(CompetitionFormat).includes(format)) {
      return new NextResponse("Formato de competición no válido", { status: 400 });
    }

    const competition = await db.competition.create({
      data: {
        name,
        format,
        rounds: (format === CompetitionFormat.LEAGUE || format === CompetitionFormat.GROUP_AND_KNOCKOUT) ? Number(rounds) : 1,
        groupSize: groupSize ? Number(groupSize) : null,
        teamsPerGroupToAdvance: teamsPerGroupToAdvance ? Number(teamsPerGroupToAdvance) : null,
        clubId: auth.session.user.clubId,
      },
    });

    return NextResponse.json(competition, { status: 201 });
  } catch (error) {
    console.error("[CREATE_COMPETITION_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
