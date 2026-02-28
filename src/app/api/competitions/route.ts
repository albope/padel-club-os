import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { CompetitionFormat } from "@prisma/client";
import { validarBody } from "@/lib/validation";
import * as z from "zod";

const CompetitionCreateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido.").max(100, "El nombre no puede superar 100 caracteres."),
  format: z.enum(["LEAGUE", "KNOCKOUT", "GROUP_AND_KNOCKOUT"], {
    errorMap: () => ({ message: "Formato de competicion no valido." }),
  }),
  rounds: z.number().int().min(1).max(4).optional(),
  groupSize: z.number().int().min(2).max(16).optional().nullable(),
  teamsPerGroupToAdvance: z.number().int().min(1).max(8).optional().nullable(),
})

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
    const auth = await requireAuth("competitions:create", { requireSubscription: true })
    if (isAuthError(auth)) return auth

    const body = await req.json();
    const result = validarBody(CompetitionCreateSchema, body);
    if (!result.success) return result.response;
    const { name, format, rounds, groupSize, teamsPerGroupToAdvance } = result.data;

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
