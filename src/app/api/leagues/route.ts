import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// API route to handle leagues

// GET function to fetch all leagues for the logged-in admin's club
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const leagues = await db.league.findMany({
      where: {
        clubId: session.user.clubId,
      },
      orderBy: {
        name: 'asc', // Corrected: Order by name
      },
      // Optionally, include a count of teams in each league
      include: {
        _count: {
          select: { teams: true },
        },
      },
    });

    return NextResponse.json(leagues);

  } catch (error) {
    console.error("[GET_LEAGUES_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST function to create a new league
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return new NextResponse("El nombre de la liga es requerido", { status: 400 });
    }

    const league = await db.league.create({
      data: {
        name,
        clubId: session.user.clubId,
      },
    });

    return NextResponse.json(league, { status: 201 });

  } catch (error) {
    console.error("[CREATE_LEAGUE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}