import { render, screen } from "@testing-library/react"
import type { MatchWithTeams } from "@/types/competition.types"
import { describe, expect, it, vi } from "vitest"
import MatchListView from "@/components/competitions/MatchListView"

const partidoFinal = {
  id: "final",
  roundNumber: 2,
  roundName: "Final",
  winnerId: "equipo-2",
  team1Id: "equipo-1",
  team2Id: "equipo-2",
  team1: { id: "equipo-1", name: "Las Bandejas" },
  team2: { id: "equipo-2", name: "Los Remates" },
  result: "4-6 3-6",
} as unknown as MatchWithTeams

describe("MatchListView", () => {
  it("destaca al campeón cuando la final tiene resultado", () => {
    render(<MatchListView matches={[partidoFinal]} onMatchClick={vi.fn()} />)

    expect(screen.getByRole("status")).toHaveTextContent("Equipo campeón")
    expect(screen.getByRole("status")).toHaveTextContent("Los Remates")
  })

  it("no anuncia un campeón antes de resolverse la final", () => {
    render(
      <MatchListView
        matches={[{ ...partidoFinal, winnerId: null, result: null }]}
        onMatchClick={vi.fn()}
      />
    )

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})
