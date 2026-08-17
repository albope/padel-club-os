import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { afterEach, describe, expect, it, vi } from "vitest"
import ConfirmacionReserva from "@/components/club/ConfirmacionReserva"
import messages from "../../../messages/es.json"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "jugador-1" } } }),
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe("ConfirmacionReserva", () => {
  it("mantiene la selección y permite reintentar tras un error", async () => {
    const onReservaConfirmada = vi.fn()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "La franja acaba de quedar ocupada." }),
      })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal("fetch", fetchMock)

    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <ConfirmacionReserva
          open
          onOpenChange={vi.fn()}
          pista={{ id: "pista-1", name: "Pista Central", type: "Cristal" }}
          fecha="2026-08-17"
          horaInicio="19:00"
          duracion={90}
          precio={24}
          slug="club-prueba"
          onReservaConfirmada={onReservaConfirmada}
        />
      </NextIntlClientProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Confirmar reserva" }))

    const error = await screen.findByRole("alert")
    expect(error).toHaveTextContent("La franja acaba de quedar ocupada.")
    expect(screen.getByText("Pista Central")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Reintentar reserva" }))

    await waitFor(() => {
      expect(onReservaConfirmada).toHaveBeenCalledOnce()
    })
    expect(screen.getByRole("heading", { level: 3, name: "Reserva confirmada!" })).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
