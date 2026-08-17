import { fireEvent, render, screen } from "@testing-library/react"
import type { Team, User } from "@prisma/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import AddTeamModal from "@/components/competitions/AddTeamModal"

const mockRefresh = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

const users = [
  { id: "jugador-1", name: "Ana" },
  { id: "jugador-2", name: "Luis" },
] as User[]

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe("AddTeamModal", () => {
  it("marca y deshabilita los jugadores que ya están inscritos", () => {
    const teams = [
      {
        id: "equipo-1",
        name: "Las Bandejas",
        player1Id: "jugador-1",
        player2Id: "otro-jugador",
      },
    ] as Team[]

    render(
      <AddTeamModal
        isOpen
        onClose={vi.fn()}
        competitionId="competicion-1"
        users={users}
        teams={teams}
      />
    )

    const opcionesAna = screen.getAllByRole("option", {
      name: "Ana — Ya inscrito en Las Bandejas",
    })
    expect(opcionesAna).toHaveLength(2)
    expect(opcionesAna.every((opcion) => opcion.hasAttribute("disabled"))).toBe(true)
  })

  it("muestra el error específico devuelto por la API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "Ya inscrito en esta competición: Ana (Las Bandejas).",
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    render(
      <AddTeamModal
        isOpen
        onClose={vi.fn()}
        competitionId="competicion-1"
        users={users}
        teams={[]}
      />
    )

    fireEvent.change(screen.getByLabelText("Nombre del Equipo"), {
      target: { value: "Los Globos" },
    })
    fireEvent.change(screen.getByLabelText("Jugador 1"), {
      target: { value: "jugador-1" },
    })
    fireEvent.change(screen.getByLabelText("Jugador 2"), {
      target: { value: "jugador-2" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Añadir Equipo" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ya inscrito en esta competición: Ana (Las Bandejas)."
    )
  })
})
