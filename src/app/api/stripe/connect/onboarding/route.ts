import { NextResponse } from "next/server"

export async function POST(_request: Request) {
  return NextResponse.json(
    { error: "Stripe Connect ya no se utiliza para cobrar reservas." },
    { status: 410 },
  )
}
