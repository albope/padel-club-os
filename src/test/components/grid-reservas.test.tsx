import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { afterEach, describe, expect, it, vi } from "vitest"
import GridReservas from "@/components/club/GridReservas"
import messages from "../../../messages/es.json"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/components/club/ConfirmacionReserva", () => ({
  default: ({ open }: { open: boolean }) => open
    ? <div data-testid="confirmacion-reserva">Confirmación abierta</div>
    : null,
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function renderizarGrid(preseleccion?: { pistaInicialId: string; horaInicial: string }) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input)
    if (url.includes("/availability")) {
      return { ok: true, json: async () => ({ bloques: [] }) }
    }
    if (url.includes("/pricing")) {
      return {
        ok: true,
        json: async () => [{ startHour: 9, endHour: 23, price: 16 }],
      }
    }
    throw new Error(`Petición inesperada: ${url}`)
  })
  vi.stubGlobal("fetch", fetchMock)

  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <GridReservas
        club={{
          slug: "club-prueba",
          primaryColor: null,
          openingTime: "09:00",
          closingTime: "12:00",
          bookingDuration: 90,
        }}
        pistas={[{ id: "pista-1", name: "Pista Central", type: "Cristal" }]}
        sesionUserId={null}
        slug="club-prueba"
        fechaInicial="2026-08-17"
        pistaInicialId={preseleccion?.pistaInicialId}
        horaInicial={preseleccion?.horaInicial}
      />
    </NextIntlClientProvider>,
  )
}

describe("GridReservas", () => {
  it("resume la franja elegida antes de abrir la confirmación", async () => {
    renderizarGrid()

    const franja = await screen.findByRole("button", {
      name: "Reservar Pista Central a las 09:00, 24€",
    })
    fireEvent.click(franja)

    const resumen = screen.getByRole("region", { name: "Resumen de la selección" })
    expect(resumen).toHaveTextContent("Pista Central · 09:00–10:30 · 24.00€")
    expect(franja).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByTestId("confirmacion-reserva")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }))

    expect(screen.getByTestId("confirmacion-reserva")).toBeInTheDocument()
  })

  it("descarta la selección al cambiar de fecha", async () => {
    renderizarGrid()

    fireEvent.click(await screen.findByRole("button", {
      name: "Reservar Pista Central a las 09:00, 24€",
    }))
    expect(screen.getByRole("region", { name: "Resumen de la selección" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Día siguiente" }))

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: "Resumen de la selección" })).not.toBeInTheDocument()
    })
  })

  it("preselecciona la misma pista y hora al repetir una reserva", async () => {
    renderizarGrid({ pistaInicialId: "pista-1", horaInicial: "10:00" })

    const resumen = await screen.findByRole("region", { name: "Resumen de la selección" })
    expect(resumen).toHaveTextContent("Pista Central · 10:00–11:30 · 24.00€")
    expect(screen.getByRole("button", {
      name: "Reservar Pista Central a las 10:00, 24€",
    })).toHaveAttribute("aria-pressed", "true")
  })
})
