import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { enabled: false, reason: "Las reservas se cobran presencialmente en el club." },
    { status: 200 },
  )
}
