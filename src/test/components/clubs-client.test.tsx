import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import ClubsClient, { type ClubItem } from "@/components/platform/ClubsClient"

const clubDemo: ClubItem = {
  id: "club-demo-1",
  name: "Club Demo Norte",
  slug: "club-demo-norte",
  subscriptionTier: "pro",
  subscriptionStatus: "active",
  trialEndsAt: null,
  esDemo: true,
  stripeSubscriptionId: null,
  _count: { courts: 3, members: 12, bookings: 24 },
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe("ClubsClient", () => {
  it("exige escribir el nombre exacto antes de eliminar un club demo", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)
    render(<ClubsClient initialClubs={[clubDemo]} />)

    const acciones = screen.getByRole("button", { name: "Acciones de Club Demo Norte" })
    acciones.focus()
    fireEvent.keyDown(acciones, { key: "Enter", code: "Enter" })
    fireEvent.click(await screen.findByRole("menuitem", { name: "Eliminar club demo" }))

    const confirmacion = screen.getByLabelText("Escribe Club Demo Norte para confirmar")
    const eliminar = screen.getByRole("button", { name: "Eliminar" })
    expect(eliminar).toBeDisabled()

    fireEvent.change(confirmacion, { target: { value: "Club Demo" } })
    expect(eliminar).toBeDisabled()

    fireEvent.change(confirmacion, { target: { value: "Club Demo Norte" } })
    expect(eliminar).toBeEnabled()
    fireEvent.click(eliminar)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/platform/demo-clubs/club-demo-1",
        { method: "DELETE" },
      )
    })
    expect(screen.queryByText("club-demo-norte")).not.toBeInTheDocument()
  })
})
