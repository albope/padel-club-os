import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// GET function to fetch all courts for the logged-in admin's club
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.clubId) {
      // If user has no club, return an empty array instead of an error
      return NextResponse.json([]);
    }

    const courts = await db.court.findMany({
      where: {
        clubId: session.user.clubId,
      },
      orderBy: {
        name: 'asc',
      }
    });

    return NextResponse.json(courts);

  } catch (error) {
    console.error("[GET_COURTS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST function to create a new court
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let clubId = session.user.clubId;

    // --- TEMPORARY LOGIC TO UNBLOCK DEVELOPMENT ---
    // If the user doesn't have a club, create one for them automatically.
    // In the future, this will be handled by a dedicated "Create Club" page.
    if (!clubId) {
      console.log("User has no club, creating one automatically...");
      const newClub = await db.club.create({
        data: {
          name: `${session.user.name || 'Admin'}'s Club`,
        }
      });

      // Update the user with the new clubId
      await db.user.update({
        where: { id: session.user.id },
        data: { clubId: newClub.id }
      });
      
      clubId = newClub.id;
      console.log(`New club created with ID: ${clubId} for user ${session.user.name}`);
    }
    // --- END OF TEMPORARY LOGIC ---

    const body = await req.json();
    const { name, type } = body;

    if (!name || !type) {
      return new NextResponse("Missing name or type", { status: 400 });
    }

    const court = await db.court.create({
      data: {
        name,
        type,
        clubId: clubId, // Now, clubId is guaranteed to exist
      },
    });

    return NextResponse.json(court, { status: 201 });

  } catch (error) {
    console.error("[CREATE_COURT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}