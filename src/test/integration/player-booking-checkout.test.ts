import { describe, expect, it } from "vitest"
import { POST } from "@/app/api/player/bookings/checkout/route"
import { crearRequest, extraerJson } from "@/test/helpers/api-route"

describe("Checkout de reservas retirado", () => {
  it("no permite iniciar pagos online aunque se envie un bookingId", async () => {
    const response = await POST(crearRequest({
      body: { bookingId: "booking-historica" },
    }))
    const data = await extraerJson(response) as { code: string; error: string }

    expect(response.status).toBe(410)
    expect(data.code).toBe("BOOKING_ONLINE_PAYMENT_DISABLED")
    expect(data.error).toContain("Paga directamente en el club")
  })
})
