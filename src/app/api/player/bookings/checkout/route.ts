import { NextResponse } from "next/server"

export async function POST(_request: Request) {
  return NextResponse.json(
    {
      error: "El pago online de reservas ya no esta disponible. Paga directamente en el club.",
      code: "BOOKING_ONLINE_PAYMENT_DISABLED",
    },
    { status: 410 },
  )
}
