import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import LeadsClient, { type LeadItem } from "@/components/leads/LeadsClient"

const lead: LeadItem = {
  id: "lead-1",
  nombre: "Fernando Hervella Gomez",
  email: "club@test.com",
  asunto: "Solicitud de demo",
  mensaje: "",
  leido: false,
  tipo: "demo",
  clubNombre: "Club Náutico Viana do Bolo",
  numeroPistas: 2,
  softwareActual: "ninguno",
  urgencia: "urgente",
  paginaOrigen: "/demo",
  utmSource: null,
  createdAt: "2026-07-21T14:08:00.000Z",
}

describe("LeadsClient", () => {
  it("abre un editor interno para responder en vez de depender de mailto", () => {
    render(<LeadsClient initialLeads={[lead]} />)

    const replyButton = screen.getByRole("button", { name: "Responder por email" })
    expect(replyButton.closest("a")).toBeNull()

    fireEvent.click(replyButton)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByLabelText("Asunto")).toHaveValue("Re: Solicitud de demo")
    expect(screen.getByLabelText("Mensaje")).toHaveValue("Hola Fernando,\n\n")
    expect(screen.getByText(/La respuesta se enviará a Fernando/)).toBeInTheDocument()
  })
})
