import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
    const user = userEvent.setup()
    render(<CompetitionsClient initialCompetitions={competitions} />)

    expect(screen.getByText("Torneo de agosto")).toBeInTheDocument()
    expect(screen.getByText("En curso", { selector: "div" })).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Finalizadas" }))

    expect(screen.getByText("Torneo de julio")).toBeInTheDocument()
    expect(screen.getByText("Finalizada", { selector: "div" })).toBeInTheDocument()
  })
})
