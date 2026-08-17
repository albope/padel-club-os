import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import { CompetitionFormat, CompetitionStatus } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"
import CompetitionsClient from "@/components/competitions/CompetitionsClient"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

type Competiciones = ComponentProps<typeof CompetitionsClient>["initialCompetitions"]

const competitions = [
  {
    id: "torneo-activo",
    name: "Torneo de agosto",
    clubId: "club-1",
    format: CompetitionFormat.KNOCKOUT,
    rounds: 1,
    status: CompetitionStatus.ACTIVE,
    groupSize: null,
    teamsPerGroupToAdvance: null,
    _count: { teams: 8 },
  },
  {
    id: "torneo-finalizado",
    name: "Torneo de julio",
    clubId: "club-1",
    format: CompetitionFormat.KNOCKOUT,
    rounds: 1,
    status: CompetitionStatus.FINISHED,
    groupSize: null,
    teamsPerGroupToAdvance: null,
    _count: { teams: 8 },
  },
] satisfies Competiciones

describe("CompetitionsClient", () => {
  it("identifica el estado de las competiciones en la vista principal", async () => {
    render(<CompetitionsClient initialCompetitions={competitions} />)

    expect(screen.getByText("Torneo de agosto")).toBeInTheDocument()
    expect(screen.getByText("En curso", { selector: "div" })).toBeInTheDocument()

    const tabFinalizadas = screen.getByRole("tab", { name: "Finalizadas" })
    fireEvent.mouseDown(tabFinalizadas, { button: 0, ctrlKey: false })

    expect(screen.getByText("Torneo de julio")).toBeInTheDocument()
    expect(screen.getByText("Finalizada", { selector: "div" })).toBeInTheDocument()
  })
})
