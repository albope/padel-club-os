import { describe, expect, it } from "vitest"
import { BookingDomainError, validarRangoReserva } from "./booking-domain"

const policy = {
  timezone: "Europe/Madrid",
  openingTime: "09:00",
  closingTime: "23:00",
  bookingDuration: 90,
  maxAdvanceBooking: 7,
}

describe("validarRangoReserva", () => {
  it("acepta una reserva valida en horario de verano del club", () => {
    expect(() => validarRangoReserva({
      startTime: new Date("2026-07-24T16:00:00Z"),
      endTime: new Date("2026-07-24T17:30:00Z"),
      policy,
      now: new Date("2026-07-23T10:00:00Z"),
      requireFuture: true,
    })).not.toThrow()
  })

  it("rechaza fechas invalidas y rangos invertidos", () => {
    expect(() => validarRangoReserva({
      startTime: new Date("invalid"),
      endTime: new Date("2026-07-24T17:30:00Z"),
      policy,
    })).toThrow(BookingDomainError)
  })

  it("aplica horario y duracion en la zona del club", () => {
    expect(() => validarRangoReserva({
      startTime: new Date("2026-07-24T05:00:00Z"),
      endTime: new Date("2026-07-24T06:30:00Z"),
      policy,
    })).toThrow(/entre 09:00 y 23:00/)
    expect(() => validarRangoReserva({
      startTime: new Date("2026-07-24T16:00:00Z"),
      endTime: new Date("2026-07-24T17:00:00Z"),
      policy,
    })).toThrow(/90 minutos/)
  })

  it("rechaza reservas que cruzan el dia local", () => {
    expect(() => validarRangoReserva({
      startTime: new Date("2026-07-24T20:30:00Z"),
      endTime: new Date("2026-07-24T22:00:00Z"),
      policy: { ...policy, closingTime: "23:59" },
    })).toThrow(/mismo dia/)
  })

  it("rechaza milisegundos ocultos aunque la duracion redondeada parezca valida", () => {
    expect(() => validarRangoReserva({
      startTime: new Date("2026-07-24T16:00:00.500Z"),
      endTime: new Date("2026-07-24T17:30:00.500Z"),
      policy,
    })).toThrow(/minutos exactos/)
  })

  it("interpreta la antelacion como dias de calendario del club", () => {
    expect(() => validarRangoReserva({
      startTime: new Date("2026-07-30T19:00:00Z"),
      endTime: new Date("2026-07-30T20:30:00Z"),
      policy,
      now: new Date("2026-07-23T20:30:00Z"),
      requireFuture: true,
    })).not.toThrow()
  })
})
