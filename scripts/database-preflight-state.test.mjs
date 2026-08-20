import { describe, expect, it } from "vitest"

import { clasificarEstadoPreflight } from "./database-preflight-state.mjs"

describe("clasificarEstadoPreflight", () => {
  it("permite desplegar las primeras migraciones en una base vacía", () => {
    expect(
      clasificarEstadoPreflight({ bookingSchema: null, publicTableCount: 0 }),
    ).toBe("vacio")
  })

  it("ejecuta las comprobaciones cuando Booking existe en public", () => {
    expect(
      clasificarEstadoPreflight({ bookingSchema: "public", publicTableCount: 27 }),
    ).toBe("listo")
  })

  it("bloquea un esquema public parcial sin Booking", () => {
    expect(
      clasificarEstadoPreflight({ bookingSchema: null, publicTableCount: 1 }),
    ).toBe("parcial")
  })

  it("bloquea Booking fuera de public aunque public esté vacío", () => {
    expect(
      clasificarEstadoPreflight({ bookingSchema: "otro_esquema", publicTableCount: 0 }),
    ).toBe("parcial")
  })
})
